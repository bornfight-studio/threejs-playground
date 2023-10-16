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
import ModelConfiguratorWrapper from "./components/ModelConfiguratorWrapper";
import RingConfiguratorWrapper from "./components/RingConfiguratorWrapper";
import SplineExportTest from "./components/SplineExportTest";
import SplineExportTestV2 from "./components/SplineExportTestV2";
import SplineExportTestV3 from "./components/SplineExportTestV3";
import MarchingOrb from "./components/MarchingOrb";
import Orb from "./components/Orb";

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

    new ModelConfiguratorWrapper();

    new RingConfiguratorWrapper();

    const splineExportTest = new SplineExportTest();
    splineExportTest.init();

    const splineExportTestV2 = new SplineExportTestV2();
    splineExportTestV2.init();

    const splineExportTestV3 = new SplineExportTestV3();
    splineExportTestV3.init();

    new MarchingOrb();
    new Orb();
});
