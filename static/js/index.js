/**
 * MAIN JS FILE
 */

/**
 * Helpers
 * Imports of helper functions are stripped out of bundle
 * Include them within "start-strip-code" and "end-strip-code" comments
 */
/* start-strip-code */
import GridHelper from "./helpers/GridHelper";
/* end-strip-code */
/**
 * Components
 */
// import FurnitureConfigurator from "./components/__FurnitureConfigurator";
// import FurnitureConfigurator from "./components/_FurnitureConfigurator";
import FurnitureConfigurator from "./components/FurnitureConfigurator";
import FabricViewer from "./components/FabricViewer";
import ModelViewer from "./components/ModelViewer";
import WebGiViewer from "./components/WebGiViewer";
import SplineExportTest from "./components/SplineExportTest";

/**
 * Check if document is ready cross-browser
 * @param callback
 */
const ready = (callback) => {
    if (document.readyState !== "loading") {
        /**
         * Document is already ready, call the callback directly
         */
        callback();
    } else if (document.addEventListener) {
        /**
         * All modern browsers to register DOMContentLoaded
         */
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        /**
         * Old IE browsers
         */
        document.attachEvent("onreadystatechange", function () {
            if (document.readyState === "complete") {
                callback();
            }
        });
    }
};

/**
 * Document ready callback
 */
ready(() => {
    /**
     * HELPERS INIT
     * Only init helpers if they exist
     * Will be undefined on production because of import stripping
     */
    if (typeof GridHelper == "function") {
        const grid = new GridHelper();
        grid.init();
    }

    /**
     * CREDITS INIT
     */
    const credits = [
        "background-color: #000000",
        "color: white",
        "display: block",
        "line-height: 24px",
        "text-align: center",
        "border: 1px solid #ffffff",
        "font-weight: bold",
    ].join(";");
    console.info("dev by: %c Bornfight Studio ", credits);

    /**
     * COMPONENTS INIT
     */

    // const furnitureConfigurator = new FurnitureConfigurator();

    // const furnitureConfigurator = new FurnitureConfigurator(".js-furniture-configurator", "../static/models/", "Chair-v4.glb");

    const furnitureConfigurator = new FurnitureConfigurator();
    furnitureConfigurator.init();

    const fabricViewer = new FabricViewer();
    fabricViewer.init();

    const modelViewer = new ModelViewer();
    modelViewer.init();

    const webGiViewer = new WebGiViewer();

    const splineExportTest = new SplineExportTest();
    splineExportTest.init();
});
