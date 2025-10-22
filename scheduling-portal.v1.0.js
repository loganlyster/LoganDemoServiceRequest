(function (thermogrid, undefined) {
    // Make a URL object from the src of this script.
    var path = new URL(document.currentScript.src);

    var iframe = null;

    var config = {};

    var container = null;

    var processMessage = function(e){
        // Ignore messages from other iframes
        if("data" in e && typeof e.data === "object" && "origin" in e.data && e.data.origin === path.origin) {
            if("type" in e.data){
                switch (e.data.type) {
                    case "portal-created":
                        sendMessage("process-css", processCss());
                        break;
                    case "portal-resized":
                        iframe.style.height = e.data.payload + "px";
                        break;
                    case "portal-scroll":
                        var page = document.getElementsByTagName("html")[0];
                        // If the top/left of the container is not within view, scroll the window to the top/left of the container
                        if(page.scrollTop > (container.offsetTop)){
                            window.scrollTo({
                                top: (container.offsetTop),
                                behavior: ("behavior" in e.data.payload ? e.data.payload.behavior : "smooth")
                            });
                        }
                        if(page.scrollLeft > (container.offsetLeft)){
                            window.scrollTo({
                                left: (container.offsetLeft),
                                behavior: ("behavior" in e.data.payload ? e.data.payload.behavior : "smooth")
                            });
                        }

                        //Scroll the container as needed.
                        container.scrollTop = e.data.payload.top;
                        container.scrollLeft = e.data.payload.left;
                        break;
                    case "portal-ready":
                        window.dispatchEvent(new Event('thermogrid:ready'));
                        break;
                    case "portal-submitted":
                        window.dispatchEvent(new Event('thermogrid:submitted'));
                        break;
                    case "portal-accepted":
                        window.dispatchEvent(new Event('thermogrid:accepted'));
                        break;
                    case "portal-rejected":
                        window.dispatchEvent(new Event('thermogrid:rejected'));
                        break;
                    default:
                        return;
                }
            }
        }
    }

    var sendMessage = function(type, payload){
        if(iframe){
            iframe.contentWindow.postMessage({
                type: type,
                payload: payload,
                origin: path.origin
            }, "*");
        }
    }

    var processCss = function () {
        var tgRules = [];

        var checkRules = function(rules){
            for (var j = 0; j < rules.length; j++) {
                var rule = rules[j];

                if (rule.selectorText && rule.selectorText.indexOf('thermogrid') >= 0)
                    tgRules.push({selectorText: rule.selectorText, cssText: rule.cssText });
            }
        };

        // Apply any CSS provided directly in the config first, as that should take precedent.
        checkRules(config.css);

        // Check any styling in the parent document that pertains to thermogrid
        if("styleSheets" in document && typeof document.styleSheets !== "undefined" && document.styleSheets !== null && document.styleSheets instanceof StyleSheetList){
            for (var i = 0; i < document.styleSheets.length; i++) {
                var sheet = document.styleSheets[i];

                try {
                    var rules = sheet.cssRules || sheet.rules;
                } catch (err) {
                    console.warn("An unknown error occurred. Some CSS rules may not be applied.");
                    continue;
                }

                if (typeof rules === "undefined" || rules === null)
                    continue;

                checkRules(rules);
            }
        }

        return tgRules;
    };

    // Initialization function
    thermogrid.init = function(options){
        var defaults = {
            height: "auto",
            width: "auto",
            css: []
        };

        config = Object.assign(defaults, options || {});

        // Add listener for messages
        window.addEventListener("message", processMessage);

        container = document.getElementById("thermogrid-scheduling-portal");
        // Make sure we found our container
        if(typeof container !== "undefined" && container !== null){

            container.style.height = config.height;
            container.style.width = config.width;
            container.style.overflow = "auto";
            container.style.scrollBehavior = "smooth";

            // Clear out anything else in here.
            container.innerHTML = "";

            // Create the iframe
            iframe = document.createElement("iframe");
            iframe.src = path.origin + "/scheduling-portal-v1.0.html&t=" + Date.now();
            iframe.style.height = "100%";
            iframe.style.width = "100%";
            iframe.style.border = "0px";
            iframe.style.overflow = "visible";

            // Append the iframe to the container
            container.append(iframe);
            // Else there isn't an element with the correct ID
        } else {
            // Throw an error to the console
            console.error("Could not find container element div#thermogrid-scheduling-portal");
        }
    }

    // Teardown function
    thermogrid.destroy = function(){
        config = {};
        if(iframe){
            iframe.remove();
            iframe = null;
        }
        window.removeEventListener("message", processMessage);
    }


    // Emit that this code is loaded.
    window.dispatchEvent(new Event('thermogrid:loaded'));
})(window.thermogrid = window.thermogrid || {});

