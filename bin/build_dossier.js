const DOSSIER_SEED_FILE_PATH = "./seed";
const DEFAULT_DOMAIN = "default";

require("./../../../privatesky/psknode/bundles/openDSU.js");
const fs = require("fs");
const openDSU = require("opendsu");
const keyssi = openDSU.loadApi("keyssi");
const resolver = openDSU.loadApi("resolver");

function storeKeySSI(seed_path, keySSI, callback) {
    fs.writeFile(seed_path, keySSI, (err) => {
        return callback(err, keySSI);
    });
}

function createDossier(callback) {
    resolver.createDSU(keyssi.buildSeedSSI(DEFAULT_DOMAIN), (err, bar) => {
        if (err) {
            return callback(err);
        }

        updateDossier(bar, callback);
    })
}

function updateDossier(bar, callback) {
    bar.delete("/", function(err){
        if(err){
            throw err;
        }

        bar.addFolder("src", "/", {batch: true, encrypt: false}, (err, archiveDigest) => {
            if (err) {
                return callback(err);
            }

            bar.getKeySSIAsString((err, keySSI) => {
                if (err) {
                    return callback(err);
                }
                storeKeySSI(DOSSIER_SEED_FILE_PATH, keySSI, callback);
            });
        });
    });
}

function build_dossier(callback) {
    fs.readFile(DOSSIER_SEED_FILE_PATH, (err, content) => {
        if (err || content.length === 0) {
            console.log(`Creating a new Dossier...`);
            return createDossier(callback);
        }

        let keySSI;
        try {
            keySSI = keyssi.parse(content.toString());
        } catch (err) {
            console.log("Invalid seed. Creating a new Dossier...");
            return createDossier(callback);
        }

        console.log("Dossier updating...");
        resolver.loadDSU(content.toString(), (err, bar) => {
            if (err) {
                return callback(err);
            }

            updateDossier(bar, callback);
        });
    });
}

build_dossier(function (err, keySSI) {
    let path = require("path");
    let projectName = path.basename(path.join(__dirname, "../"));
    if (err) {
        console.log(`Build process of <${projectName}> failed.`);
        console.log(err);
        process.exit(1);
    }
    console.log(`Build process of <${projectName}> finished. Dossier's KeySSI:`, keySSI);
});
