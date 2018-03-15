/**
 * Before use you should install required modules
 * npm install maven
 * npm install --save fs-extra
 * npm install colors
 */

/** node js maven module */
const mvn = require('maven');

/** node js file system module */
const fse = require('fs-extra')

/** Colorful terminal */
const colors = require('colors');

/** Git repository absolute path */
const git_repo = "ABSOLUTE_PATH_GIT_REPO"

/** Server directory */
const project_root2_folder = "SERVER_DIR"

/** An object that represents the various definitions that will be passed to Java/Maven via -Dkey=value parameters. */
const mavenDefines = { 'skipTests': true }

/** A list of lifecycle phases and/or goals, e.g. 'compile', [ 'clean', 'install' ] or [ 'release:prepare', 'release:perform' ]. */
const defaultLifecyclePhases = ['clean', 'install'];

/** The variety of modules you work with */
let modules = [];

/** Operation mode */
let mode;

/** Selected module. In common definition contains some submodules */
let selectedModule;

/** Module entity. Contains maven settings and descriptions how to build particular module */
class Module {

    /**
     * Constructor
     * @param {string} path path to module (root directory with pom.xml)
     * @param {[]} profiles a list of profiles
     * @param {[]} commands a list of lifecycle phases
     * @param {boolean} offline flag - build in online/offline mode
     */
    constructor(path, profiles, commands, offline) {
        this.path = path;
        this.profiles = profiles || [];
        this.commands = commands || defaultLifecyclePhases;
        this.offline = offline || false;
    }

    /** Return maven build command */
    getCommand() {
        return mvn.create({
            cwd: git_repo + this.path,
            profiles: this.profiles,
            offline: this.offline
        });
    }
}

/**
 * Flash console log
 * @param {*} someText text to display
 */
function flashLight(someText) {
    return someText.underline.bold.yellow;
}

/** Parse arguments */
process.argv.forEach(function (val, index) {
    // The first two attributes: node mvn
    switch (index) {
        case 2:
            mode = val;
            break;
        case 3:
            selectedModule = val;
            if (val == "login") {
                modules = [
                    new Module("project_root/frontend/online_login"),
                    new Module("project_root/frontend/online", ['dev']),
                ]
            } else if (val = "f_common") {
                modules = [
                    new Module("project_root/frontend/common_lib", ['dev']),
                    new Module("project_root/frontend/common", ['dev']),
                    new Module("project_root/frontend/online_login"),
                    new Module("project_root/frontend/online", ['dev'])
                ]
            }
            break;
    }
});

/** 
 * Process maven command
 */
async function processMaven() {
    let promises = [];
    console.log(modules);
    for (index in modules) {
        let module = modules[index];
        console.log(flashLight("Building module: ") + flashLight(module.path));
        try {
            let result = await module.getCommand().execute(module.commands, mavenDefines);
            promises.push(result);
        } catch (error) {
            return Promise.reject(module.path);
        }
    }
    return Promise.all(promises);
}

/**
 * Process file system
 */
async function processFileSystem() {
    let project_root2, war, gr, serv;
    switch (selectedModule) {
        case "ur":
        case "login":
            // Old unwrapped dir
            project_root2 = project_root2_folder + "folder/project_root2";
            // Old module
            war = project_root2_folder + "folder/project_root2.war";
            // Fresh module
            gr = git_repo + "folder/project_root2.war";
            // Target directory
            serv = project_root2_folder + "folder/project_root2.war"
            await operateFileSystem(project_root2, war, gr, serv);
            break;
    }
}

/**
 * Operating file system
 * @param {string} project_root2 unwrapped directory contains old files
 * @param {string} war old module
 * @param {string} gr fresh module
 * @param {string} serv fresh module destination folder
 */
async function operateFileSystem(project_root2, war, gr, serv) {
    try {
        await fse.remove(project_root2);
        console.log('Removing unwrapped directory ' + flashLight(project_root2) + ' - success!'.green);
        await fse.remove(war);
        console.log('Removing module ' + flashLight(project_root2) + ' - success!'.green);
        await fse.copy(gr, serv)
        console.log('Copying ' + flashLight(project_root2) + ' - success!'.green);
    } catch (err) {
        console.error(err)
    }
}

/**
 * Process command here
 */
async function doProcess() {
    switch (mode) {
        case "package":
            await processMaven();
            break;
        case "install":
            try {
                await processMaven();
                await processFileSystem();
            } catch (error) {
                console.log("##############################################################################".red);
                console.log("#                           BUILDING MODULE ERROR!                           #".red);
                console.log("module name: " + error);
                console.log("#                           BUILDING MODULE ERROR!                           #".red);
                console.log("##############################################################################".red);
            }
            break;
        case "clean":
            await processFileSystem();
            break;
    }
}

/** Entry point */
doProcess();