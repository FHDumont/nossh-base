var http = require('http');
var express = require('express');
var path = require('path');
var fs = require("fs");
var ps = require('ps-node');
var config = require("./config.json");
const exec = require('child_process').exec;

var app = express();
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.bodyParser());
app.use('/css', express.static(__dirname + '/css'));
app.use('/img', express.static(__dirname + '/img'));

var hasControllerInitFinished = false;
var hasControllerInitStarted = false;
var hasK8sInitFinished = false;
var hasK8sInitStarted = false;
var environmentType = loadEnvironment();
var initializationType = config[environmentType]["initializationType"];
var startControllerScript = config[environmentType]["startControllerScript"];
var startK8sScript = config[environmentType]["startK8sScript"];
var licenseFile = config[environmentType]["licenseFile"];
var checkStatusScript = config[environmentType]["checkStatusScript"];
var restartAppScript = config[environmentType]["restartAppScript"];
var targetEnvFile = config[environmentType]["targetEnvFile"];
var logfileName = config[environmentType]["logfileName"];
var hostname = "";
var hostname_from_url = "";
var provisionLicenseScript = config[environmentType]["provisionLicenseScript"];
var startEUMScript = config[environmentType]["startEUMScript"];
var updateAppScript = config[environmentType]["updateAppScript"];
var upgradeECScript = config[environmentType]["upgradeECScript"];

function loadEnvironment() {
    if ( process.env.ENVIRONMENT_TYPE == undefined ) {
        return "LOCAL_CONTROLLER";
    } else {
        return process.env.ENVIRONMENT_TYPE
    }
}

app.get('/', function (req, res, next) {

    console.log("app.get home");

    if (initializationType == "CONTROLLER") {
        controllerHome(req, res);
    }
    else if (initializationType == "APPSERVER") {
        appServerHome(req, res);
    }
    else if (initializationType == "K8S") {
        k8sHome(req, res);
    }
});

function appServerHome(req, res) {

    res.render('as_home', {
        message: "",
        logging: "",
        refreshInterval: 10000
    });
}

app.post('/updateConfig', function (req, res, next) {
    console.log('app.post updateConfig');
    fs.readFile(targetEnvFile, function (err, data) {
        if (err) next(err);
        var fileText = "";
        if (data) {
            fileText = data.toString();
        }
        res.render('as_update_env', {
            envFile: fileText,
            refreshInterval: 10000
        });
    });
});

function reverseText(textToReverse) {

    var lines = textToReverse.split("\n");
    var result = "";

    for (var i = 0; i < lines.length; i++) {
        result = lines[i] + "\n" + result;
    }
    return result;
}

app.post('/saveEnv', function (req, res, next) {
    console.log('app.post saveEnv');

    var configEnv = req.body.configEnv;
    console.log(configEnv);

    fs.writeFile(targetEnvFile, configEnv, function (err, data) {
        if (err) next(err);
        res.redirect('/');
    });
});

app.post('/home', function (req, res) {
    console.log('app.post home');
    res.redirect('/');
});

app.post('/checkStatus', function (req, res) {

    console.log('app.post checkStatus: ' + checkStatusScript);

    var scriptOutput = "";

    var testscript = exec("bash " + checkStatusScript);
    testscript.stdout.on('data', function (data) {
        console.log(data);
        scriptOutput += data;
    });

    testscript.stdout.on('close', function (data) {
        console.log("close testscript");
        res.render('as_home', {
            message: "",
            logging: scriptOutput,
            refreshInterval: 10000
        });
    });

});

app.get('/startEUM', function (req, res, next) {
    console.log('app.get startEUM');

    var filename = path.basename(startEUMScript);

    ps.lookup({
        command: 'bash',
        arguments: filename
    }, function (err, resultList) {
        if (err) {
            next(err);
        }

        if (resultList.length > 0) {
            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('auto_update', {
                    message: "Starting EUM Server",
                    logging: reverseText(fileText),
                    refreshInterval: 3
                });
            });
        }
        else {

            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('controller_home', {
                    hasControllerInitFinished: hasControllerInitFinished,
                    url: "http://" + hostname + ":8090",
                    logging: reverseText(fileText),
                    refreshInterval: 10000
                });
            });
        }
    });

});

app.post('/startEUM', function (req, res) {
    console.log('app.post startEUM');

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + startEUMScript + " 2>&1 | tee '" + logfileName + "'");

    res.render('auto_update', {
        message: "Starting EUM Server",
        logging: "",
        refreshInterval: 3
    });
});

app.get('/upgradeEC', function (req, res, next) {
    console.log('app.get upgradeEC');

    var filename = path.basename(upgradeECScript);

    ps.lookup({
        command: 'bash',
        arguments: filename
    }, function (err, resultList) {
        if (err) {
            next(err);
        }

        if (resultList.length > 0) {
            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('auto_update', {
                    message: "Upgrading Enterprise Console",
                    logging: reverseText(fileText),
                    refreshInterval: 3
                });
            });
        }
        else {

            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('ec_upgrade_complete', {
                    url: "http://" + hostname + ":9191",
                    message: "Log in to Enterprise Console using admin / appd. Then select the Upgrade Controller option from the Controller screen.",
                    logging: reverseText(fileText),
                    refreshInterval: 10000
                });
            });
        }
    });

});

app.post('/upgradeEC', function (req, res) {
    console.log('app.post upgradeEC');

    var fullHost = req.headers.host;
    var hostArray = fullHost.split(":");

    if (hostArray.length > 1) {
        hostname = hostArray[0];
    }

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + upgradeECScript + " 2>&1 | tee '" + logfileName + "'");

    res.render('auto_update', {
        message: "Upgrading Enterprise Console",
        logging: "",
        refreshInterval: 3
    });
});

app.get('/provisionLicense', function (req, res, next) {
    console.log('app.get provisionLicense');

    var filename = path.basename(provisionLicenseScript);

    ps.lookup({
        command: 'bash',
        arguments: filename
    }, function (err, resultList) {
        if (err) {
            next(err);
        }

        if (resultList.length > 0) {
            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('auto_update', {
                    message: "Provisioning License",
                    logging: reverseText(fileText),
                    refreshInterval: 3
                });
            });
        }
        else {

            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('controller_home', {
                    hasControllerInitFinished: hasControllerInitFinished,
                    url: "http://" + hostname + ":8090",
                    logging: reverseText(fileText),
                    refreshInterval: 10000
                });
            });
        }
    });

});

app.post('/provisionLicense', function (req, res) {
    console.log('app.post provisionLicense');

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + provisionLicenseScript + " 2>&1 | tee '" + logfileName + "'");

    res.render('auto_update', {
        message: "Provisioning License",
        logging: "",
        refreshInterval: 3
    });
});

app.get('/restartApp', function (req, res, next) {
    console.log('app.get restartApp');

    var filename = path.basename(restartAppScript);

    ps.lookup({
        command: 'bash',
        arguments: filename
    }, function (err, resultList) {
        if (err) {
            next(err);
        }

        if (resultList.length > 0) {
            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('auto_update', {
                    message: "Restarting",
                    logging: reverseText(fileText),
                    refreshInterval: 3
                });
            });
        }
        else {

            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('as_home', {
                    message: "Restart complete",
                    logging: reverseText(fileText),
                    refreshInterval: 10000
                });
            });
        }
    });

});

app.post('/restartApp', function (req, res) {
    console.log('app.post restartApp');

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + restartAppScript + " 2>&1 | tee '" + logfileName + "'");

    res.render('auto_update', {
        message: "Restarting Application",
        logging: "",
        refreshInterval: 3
    });
});

function isScriptRunning(scriptName, parentCallBack) {

    var filename = path.basename(scriptName);

    ps.lookup({
        command: 'bash',
        arguments: filename
    }, function (err, resultList) {

        if (err) {
            next(err);
        }

        if (resultList.length > 0) {
            parentCallBack(true);
        }
        else {
            parentCallBack(false);
        }
    });

}

function controllerHome(req, res, err) {

    var fullHost = req.headers.host;
    var hostArray = fullHost.split(":");

    if (hostArray.length > 1) {
        hostname_from_url = hostArray[0];
    }

    isScriptRunning(startControllerScript, function (isRunning) {

        if (isRunning) {
            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('auto_update', {
                    message: "Starting Controller",
                    logging: reverseText(fileText),
                    refreshInterval: 4
                });
            });
        }
        else {
            if (hasControllerInitStarted) {

                hasControllerInitFinished = true;
                fs.readFile(logfileName, function (err, data) {
                    if (err) next(err);
                    var fileText = "";
                    if (data) {
                        fileText = data.toString();
                    }
                    res.render('controller_home', {
                        hasControllerInitFinished: hasControllerInitFinished,
                        url: "http://" + hostname_from_url + ":8090",
                        logging: reverseText(fileText),
                        refreshInterval: 100000
                    });
                });

            }
            else {
                res.render('controller_home', {
                    hasControllerInitFinished: hasControllerInitFinished,
                    url: "http://" + hostname + ":8090",
                    logging: "",
                    refreshInterval: 100000
                });
            }

        }
    });
}

app.post('/controllerStartRemote', function (req, res, next) {
    console.log('app.post controllerStartRemote');

    var controllerDNS = req.body.controllerDNS;
    console.log(controllerDNS);

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + startControllerScript + " '" + controllerDNS + "' 2>&1 | tee '" + logfileName + "'");
    hasControllerInitStarted = true;

    res.send('<p>controllerStartRemote</p>');
});

app.post('/controllerInit', function (req, res, next) {
    console.log('app.post controllerInit');

    var fullHost = req.headers.host;
    var hostArray = fullHost.split(":");

    if (hostArray.length > 1) {
        hostname = hostArray[0];
        exec("bash rm -f '" + logfileName + "'");
        var testscript = exec("bash " + startControllerScript + " '" + hostname + "' 2>&1 | tee '" + logfileName + "'");
        hasControllerInitStarted = true;
    }
    else {
        var err = new Error("Problem with request");
        err.status = 500;
        next(err);
    }

    res.render('auto_update', {
        message: "Starting Controller",
        logging: "",
        refreshInterval: 5
    });

});

app.get('/controllerInit', function (req, res, next) {

    if (hostname.length == 0) {
        res.redirect('/');
    }
    else {

        var filename = path.basename(startControllerScript);

        ps.lookup({
            command: 'bash',
            arguments: filename
        }, function (err, resultList) {
            if (err) {
                next(err);
            }

            if (resultList.length > 0) {
                fs.readFile(logfileName, function (err, data) {
                    if (err) next(err);
                    var fileText = "";
                    if (data) {
                        fileText = data.toString();
                    }
                    res.render('auto_update', {
                        message: "Starting Controller",
                        logging: reverseText(fileText),
                        refreshInterval: 4
                    });
                });
            }
            else {

                hasControllerInitFinished = true;
                fs.readFile(logfileName, function (err, data) {
                    if (err) next(err);
                    var fileText = "";
                    if (data) {
                        fileText = data.toString();
                    }
                    res.render('controller_home', {
                        hasControllerInitFinished: hasControllerInitFinished,
                        url: "http://" + hostname + ":8090",
                        logging: reverseText(fileText),
                        refreshInterval: 100000
                    });
                });
            }
        });
    }
});

function k8sHome(req, res, err) {

    isScriptRunning(startK8sScript, function (isRunning) {

        if (isRunning) {
            fs.readFile(logfileName, function (err, data) {
                if (err) next(err);
                var fileText = "";
                if (data) {
                    fileText = data.toString();
                }
                res.render('auto_update', {
                    message: "Starting Kubernetes",
                    logging: reverseText(fileText),
                    refreshInterval: 4
                });
            });
        }
        else {
            res.render('k8s_home', {
                hasK8sInitFinished: hasK8sInitFinished,
                logging: "",
                refreshInterval: 100000
            });
        }
    });
}

app.post('/k8sInitRemote', function (req, res, next) {
    console.log('app.post k8sInitRemote');

    var controllerDNS = req.body.controllerDNS;
    console.log(controllerDNS);

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + startK8sScript + " '" + controllerDNS + "' 2>&1 | tee '" + logfileName + "'");
    hasK8sInitStarted = true;

    res.send('<p>K8sInitRemote</p>');
});

app.post('/k8sInit', function (req, res, next) {
    console.log('app.post k8sInit');

    var fullHost = req.headers.host;
    var hostArray = fullHost.split(":");

    if (hostArray.length > 1) {
        hostname = hostArray[0];
        exec("bash rm -f '" + logfileName + "'");
        var testscript = exec("bash " + startK8sScript + " '" + hostname + "' 2>&1 | tee '" + logfileName + "'");
        hasK8sInitStarted = true;
    }
    else {
        var err = new Error("Problem with request");
        err.status = 500;
        next(err);
    }

    res.render('auto_update', {
        message: "Starting Kubernetes",
        logging: "",
        refreshInterval: 5
    });
});

app.get('/k8sInit', function (req, res, next) {

    console.log('app.get k8sInit');
    if (hostname.length == 0) {
        res.redirect('/');
    }
    else {

        var filename = path.basename(startK8sScript);

        ps.lookup({
            command: 'bash',
            arguments: filename
        }, function (err, resultList) {
            if (err) {
                next(err);
            }

            if (resultList.length > 0) {
                fs.readFile(logfileName, function (err, data) {
                    if (err) next(err);
                    var fileText = "";
                    if (data) {
                        fileText = data.toString();
                    }
                    res.render('auto_update', {
                        message: "Starting Kubernetes",
                        logging: reverseText(fileText),
                        refreshInterval: 4
                    });
                });
            }
            else {

                hasK8sInitFinished = true;
                fs.readFile(logfileName, function (err, data) {
                    if (err) next(err);
                    var fileText = "";
                    if (data) {
                        fileText = data.toString();
                    }
                    res.render('k8s_init_complete', {
                        message: "Log in to the Cluster with username / password: developer / <any value>",
                        url: "https://" + hostname + ":8443",
                        logging: reverseText(fileText),
                        refreshInterval: 100000
                    });
                });
            }
        });
    }
});

app.post('/appUpdateRemote', function (req, res, next) {
    console.log('app.post appUpdateRemote');

    var controllerDNS = req.body.controllerDNS;
    console.log(controllerDNS);

    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + updateAppScript + " '" + controllerDNS + "' 2>&1 | tee '" + logfileName + "'");
    hasControllerInitStarted = true;

    res.send('<p>controllerStart</p>');
});

app.post('/updateLicense', function (req, res, next) {
    console.log('app.post updateLicense');
    fs.readFile(licenseFile, function (err, data) {

        var fileText = "";

        if (err) {
            if (err.code != "ENOENT") {
                next(err);
            }
        }
        else if (data) {
            fileText = data.toString();
        }
        res.render('controller_update_license', {
            licenseText: fileText,
            refreshInterval: 10000
        });
    });
});

app.post('/saveLicense', function (req, res, next) {
    console.log('app.post saveLicense');

    var licenseText = req.body.licenseText;

    fs.writeFile(licenseFile, licenseText, function (err, data) {
        if (err) next(err);
        res.redirect('/');
    });
});

app.use(function (err, req, res, next) {

    console.log("Something went wrong: " + err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

function autoStartController() {
    console.log('autoStartController: ' + hostname);
    exec("bash rm -f '" + logfileName + "'");
    var testscript = exec("bash " + startControllerScript + " '" + hostname + "' 2>&1 | tee '" + logfileName + "'");
    hasControllerInitStarted = true;
}

http.createServer(app)
    .listen(3000, function () {
        console.log('Express server listening on port ' + 3000);

        if (process.env.CONTROLLER_DNS) {
            hostname = process.env.CONTROLLER_DNS;
            setTimeout(() => {
                autoStartController();
            });
        }
    });