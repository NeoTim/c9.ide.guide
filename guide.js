define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "ui", "commands", "menus", "preferences", "settings",
        "tabManager", "c9"
    ];
    main.provides = ["guide"];
    return main;

// To test this run https://ide.c9.io/bradydowling/guided-tour?debug=2&debug=1
/*
BUGS
- [ ] start tour. complete tour. start tour. open terminal. terminal is no longer part of tour.
- [ ] start tour. complete tour. start tour. + thingy no longer slides to correct position.
TODO
- [x] Add doc links
- [x] Fix z-index
- [x] Pulsate thingies
- [x] Add content
- [x] Show guide only on first workspace open
- [x] Arrow to show a speech bubble
- [x] Make sure thingy's disappear properly
- [x] Update thingies when the UI changes
? When user gets to the last tip we could say done and reference the help menu with the guided tour
*/

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var ui = imports.ui;
        var menus = imports.menus;
        var commands = imports.commands;
        var settings = imports.settings;
        var tabManager = imports.tabManager;
        var c9 = imports.c9;
        var prefs = imports.preferences;
        
        /***** Initialization *****/

        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit = plugin.getEmitter();
        
        var RIGHT = 1 << 1;
        var LEFT = 1 << 2;
        var BOTTOM = 1 << 3;
        var TOP = 1 << 4;
        
        var THINGY_MARGIN = 0;
        var THINGY_SIZE = 10;
        var POPUP_MARGIN = 17;
        
        var thingies;
        var popup;
        var showing;
        var currentPopup;
        
        var allThingies = [
            // "Workspace", 
            { 
                query: ".workspace", width: 340, attachment: LEFT, where: RIGHT, wherePopup: RIGHT | BOTTOM,
                color: "blue",
                title: "Manage and upload files & folders", 
                body: "Here's where all of your project files are. Double click a file to open it and right click for additional options. You can also create, delete, and move files around. <br /><br />Click the settings icon in the top right corner of the Workspace panel for additional options. Drag and drop to upload files and download them by right-clicking.<br /><br /><a href='https://docs.c9.io/docs/file-revision-history' target='_blank'>Read about Restoring Deleted Files</a>" 
            },
            // "Navigate", 
            { 
                query: ".navigate", width: 300, attachment: LEFT, where: RIGHT, 
                color: "green",
                title: "Quickly navigate to files", 
                body: "The Navigate panel allows for quick searching and opening of files. Use Cmd-E to open the panel then navigate to any file in the file system by typing part of the filename or path.<br /><br /><a href='https://docs.c9.io/docs/navigate' target='_blank'>More about the Navigate Panel</a>" 
            },
            // "New Tab", 
            { 
                query: ".plus_tab_button", width: 360, attachment: LEFT, where: RIGHT | BOTTOM, 
                color: "green",
                title: "Open a file, terminal, or recent tabs", 
                body: "Click the plus button to open a new tab for a file or terminal instance. You can also open an immediate window for testing Javascript expressions or reopen recently closed tabs.<br /><br /><a href='https://docs.c9.io/docs/immediate-window' target='_blank'>More about the Immediate Window</a>" 
            },
            // "Terminal", 
            { 
                query: function(){
                    var t; 
                    if (!tabManager.getTabs().some(function(tab){
                        if (tab.editorType == "terminal") { t = tab; return true };
                    })) return;
                    return t.aml.$button;
                }, width: 300, attachment: BOTTOM, where: TOP, title: "Full Linux terminal", 
                color: "blue",
                body: "With full sudo access in the terminal, you can create files, run code, and install software. Open a new terminal at any time with Alt + T.<br /><br /><a href='https://docs.c9.io/docs/terminal' target='_blank'>More about the Terminal</a>" 
            },
            // "Preview", 
            { 
                query: ".preview", width: 350, attachment: TOP, where: BOTTOM, 
                color: "orange",
                title: "Preview your app as you code", 
                body: "Click Preview to open the current file in a raw preview, like for HTML or Markdown, or to see it as it's running on the server. To preview your running application, you'll need to first run it with the Run button or by executing a command from the terminal.<br /><br /><a href='https://docs.c9.io/docs/run-an-application#section--pre-view-your-application' target='_blank'>More about Previewing Your Application</a>" 
            },
            // "Run", 
            { 
                query: ".runbtn", width: 300, attachment: TOP, where: BOTTOM, 
                color: "green",
                title: "Run your app or file", 
                body: "Running from here will always run your app on port 8080 and use the default run configuration for the file or type of project you're using. Once it's running, view your app by clicking Preview or by going straight to your application URL (found in the Share dialogue).<br /><br /><a href='https://docs.c9.io/docs/running-and-debugging-code' target='_blank'>More about Running Your Application</a>" 
            },
            // "Share", 
            { 
                query: ".c9-share", width: 300, attachment: TOP | LEFT, where: BOTTOM | LEFT, 
                color: "orange",
                title: "Share your work with anyone", 
                body: "Click here to invite others to view or edit your code. Here you'll also find your application URL, which you can use to view or share your running app.<br /><br /><a href='https://docs.c9.io/docs/share-a-workspace' target='_blank'>More about Sharing a Workspace</a>" 
            },
            // "Collaborate", 
            { 
                query: ".collab", width: 400, attachment: RIGHT, where: LEFT, 
                color: "orange",
                title: "Follow and chat with other collaborators", 
                body: "From the Collaboration panel, you can control all users' access to the workspace, see what files users are working on, and use real-time chat.<br /><br /><a href='https://docs.c9.io/docs/share-a-workspace' target='_blank'>More about Sharing a Workspace</a>" 
            },
            // "Outline", 
            { 
                query: ".outline", width: 320, attachment: RIGHT, where: LEFT, 
                color: "blue",
                title: "File functions list and structure", 
                body: "The Outline panel shows you a full list of all functions and definitions in your file so you can quickly navigate through your file without having to read every line of code. The outline view has support for over a dozen languages.<br /><br /><a href='https://docs.c9.io/docs/supported-languages' target='_blank'>See All Supported Languages</a>" 
            },
            // "Debugger", 
            { 
                query: ".debugger", width: 320, attachment: RIGHT, where: LEFT, 
                color: "green",
                title: "Built-in step-through debugging", 
                body: "Set a breakpoint in a Node, PHP, Go, or C++ file by clicking next to the appropriate line number in your file. Then when you run your program, the debug panel will open up and you can see what variables are set and execute your code one line at a time. <br /><br /><a href='https://docs.c9.io/docs/debugging-your-code' target='_blank'>More about Debugging</a>"
            },
            // Preview Pane - Preview Chooser 
            { 
                query: ".btn-preview-choice", width: 340, attachment: TOP, where: BOTTOM, 
                color: "green",
                title: "Preview your files in various ways", 
                body: "When previewing your application, you may choose from a variety of different browsers to test your application in.<br /><br /><a href='https://docs.c9.io/docs/browser-testing' target='_blank'>More about Testing in Different Browsers</a>"
            }
        ];

        function load() {
            menus.addItemByPath("Support/Start Guided Tour", new ui.item({
                onclick: show,
            }), 150, plugin);
            
            settings.on("read", function(){
                settings.setDefaults("user/tour", [["complete", false]]);
                
                // TODO Disable this before deploying
                if (!settings.getBool("user/tour/@complete") || true)
                    show();
            });
        }

        var drawn = false;

        function draw() {
            if (drawn) return;
            drawn = true;

            // Insert CSS
            ui.insertCss(require("text!./style.css"), options.staticPrefix, plugin);

            // Draw the thingies
            thingies = allThingies;
            thingies.forEach(drawThingy);

            emit("draw");
        }

        /***** Methods *****/
        
        function setPosition(htmlNode, pos, def, width, height, margin, isThingy, isUpdate) {
            htmlNode.style.right = 
            htmlNode.style.left = 
            htmlNode.style.top = 
            htmlNode.style.bottom = "";
            
            function right(){ return window.innerWidth - pos.left - pos.width; }
            function bottom(){ return window.innerHeight - pos.top - pos.height; }
            
            var offsetW = isThingy ? width/2 : 0;
            var offsetH = isThingy ? height/2 : 0;
            var corW = isThingy ? 0 : width;
            var corH = isThingy ? 0 : height;
            var maxW = window.innerWidth - corW - margin;
            var maxH = window.innerHeight - corH - margin;
            
            var where = isThingy ? def.where : def.wherePopup || def.where;
            
            if (where & LEFT) {
                if (def.attachment & RIGHT)
                    htmlNode.style.right = (right() + pos.width - offsetW + margin) + "px";
                else
                    htmlNode.style.left = (pos.left - corW - offsetW - margin) + "px";
            }
            else if (where & RIGHT) {
                if (def.attachment & RIGHT)
                    htmlNode.style.right = (right() + pos.width + margin - offsetW) + "px";
                else
                    htmlNode.style.left = (pos.left + pos.width + margin - offsetW) + "px";
            }
            else {
                if (def.attachment & RIGHT)
                    htmlNode.style.right = Math.max(margin, (right() + ((pos.width - width) / 2))) + "px";
                else
                    htmlNode.style.left = Math.min(maxW, Math.max(margin, (pos.left + ((pos.width - width) / 2)))) + "px";
            }
            
            if (where & TOP) {
                if (def.attachment & BOTTOM)
                    htmlNode.style.bottom = (bottom() + pos.height - offsetH + margin) + "px";
                else
                    htmlNode.style.top = (pos.top - corH - offsetH - margin) + "px";
            }
            else if (where & BOTTOM) {
                if (def.attachment & BOTTOM)
                    htmlNode.style.bottom = (bottom() + pos.height + margin - offsetH) + "px";
                else
                    htmlNode.style.top = (pos.top + pos.height + margin - offsetH) + "px";
            }
            else {
                if (def.attachment & BOTTOM)
                    htmlNode.style.bottom = Math.max(margin, (bottom() + ((pos.height - height) / 2))) + "px";
                else
                    htmlNode.style.top = Math.min(maxH, Math.max(margin, (pos.top + ((pos.height - height) / 2)))) + "px";
            }
            
            if (!isThingy) updateBalloon(htmlNode, def);
        }
        
        function updateBalloon(htmlNode, def){
            var h;
            
            htmlNode.classList.remove("balloon-right", "balloon-left", 
                "balloon-top", "balloon-bottom");
            
            var where = def.wherePopup || def.where;
            
            if (where & LEFT) htmlNode.classList.add("balloon-right"), h = 0;
            else if (where & RIGHT) htmlNode.classList.add("balloon-left"), h = 0;
            if (where & BOTTOM) htmlNode.classList.add("balloon-top"), h = 1;
            else if (where & TOP) htmlNode.classList.add("balloon-bottom"), h = 1;
            
            var balloon = popup.firstElementChild;
            balloon.style.left =
            balloon.style.top = "";
            
            if (!(where & BOTTOM))
                balloon.classList.add("white");
            else
                balloon.classList.remove("white");
            
            if (htmlNode.className.match(/balloon/g).length == 2) 
                return;
            
            if (h == 0) {
                balloon.style.top = (def.thingy.offsetTop - htmlNode.offsetTop - THINGY_SIZE - 1) + "px";
            }
            else {
                balloon.style.left = (def.thingy.offsetLeft - htmlNode.offsetLeft - THINGY_SIZE - 1) + "px";
            }
        }

        function drawThingy(def) {
            var el = typeof def.query === "function"
                ? def.query()
                : document.querySelector(def.query);
            
            if (!el) return;
            
            var thingy = document.body.appendChild(document.createElement("div"));
            thingy.className = "thingy";
                
            var pos = el.getBoundingClientRect();
            setPosition(thingy, pos, def, THINGY_SIZE, THINGY_SIZE, THINGY_MARGIN, true);
            
            thingy.onclick = function(){ togglePopup(def); };
            
            def.el = el;
            def.thingy = thingy;
        }
        
        function togglePopup(def){
            if (popup && currentPopup === def) {
                hidePopup(true);
                return;
            }
            showPopup(def);
        }
        
        function showPopup(def){
            if (!popup) {
                popup = document.body.appendChild(document.createElement("div"));
                popup.className = "thingy-popup"
                popup.title = def.title;
                
                popup.innerHTML = "<div class='balloon'></div>"
                    + "<span class='close'></span>" 
                    + "<span class='title'></span>" 
                    + "<p></p>"
                    + "<div class='tourButtons'>"
                        + "<a href='javascript:void(0)' class='skip'>End Tour</a>"
                    + "</div>";
                
                var buttons = popup.querySelector(".tourButtons");
                popup.querySelector(".skip").onclick = function(){ hide(); };
                var btnDone = new ui.button({
                    htmlNode: buttons,
                    skin: "btn-default-css3",
                    style: "display:inline-block;",
                    "class": "btn-green",
                    onclick: function(){
                        var idx = thingies.indexOf(currentPopup);
                        
                        while (thingies[++idx] && !thingies[idx].thingy) {}
                        if (!thingies[idx]) {
                            idx = -1;
                            while (thingies[++idx] && !thingies[idx].thingy) {}
                        }
                        if (!thingies[idx] || thingies[idx].thingy.style.display == "none") 
                            return hidePopup();
                        
                        showPopup(thingies[idx]);
                    }
                });
                btnDone.oCaption.parentNode.innerHTML = "Next <span style='font-size: 1.3em;display: inline-block;vertical-align: top;'>&#x21E5;</span>";
                
                popup.querySelector(".close").onclick = function(){
                    hidePopup();
                }
            }
            else {
                hidePopup();
            }
            
            popup.style.transition = "";
            popup.classList.remove("green", "blue", "orange");
            popup.classList.add(def.color);
            if (def.width)
                popup.style.width = def.width + "px";
            
            popup.querySelector("span.title").innerHTML = def.title;
            popup.querySelector("p").innerHTML = def.body;
            
            var thingy = def.thingy;
            var pos = thingy.getBoundingClientRect();
            
            popup.style.display = "block";
            thingy.classList.add("active");
            setPosition(popup, pos, def, popup.offsetWidth, popup.offsetHeight, POPUP_MARGIN);
            
            currentPopup = def;
        }
        
        function hidePopup(onlyCurrent){
            if (currentPopup) {
                if (!onlyCurrent) {
                    currentPopup.thingy.style.display = "none";
                    currentPopup.shown = true;
                }
                currentPopup.thingy.classList.remove("active");
                currentPopup = null;
            }
            
            popup.style.display = "none";
        }
        
        var timer, listen;
        function enable(){
            timer = setInterval(check, 1000);
            document.body.addEventListener("mouseup", delayCheck);
        }
        
        function disable(){
            clearInterval(timer);
            document.body.removeEventListener("mouseup", delayCheck);
        }
        
        function check(){
            thingies.forEach(function(def){
                if (def.shown) return;
                
                if (!def.thingy) {
                    drawThingy(def);
                    
                    if (def.thingy && !currentPopup)
                        showPopup(def);
                }
                else if (def.el && !def.el.offsetHeight && !def.el.offsetWidth) {
                    if (currentPopup == def)
                        hidePopup();
                        
                    def.thingy.parentNode.removeChild(def.thingy);
                    def.thingy = def.el = null;
                }
                else {
                    var pos = def.el.getBoundingClientRect();
                    setPosition(def.thingy, pos, def, 
                        THINGY_SIZE, THINGY_SIZE, THINGY_MARGIN, true);
                    
                    if (currentPopup == def) {
                        var p = def.thingy.getBoundingClientRect();
                        pos = { 
                            left: parseFloat(def.thingy.style.left) || p.left, 
                            width: p.width,
                            top: parseFloat(def.thingy.style.top) || p.top, 
                            height: p.height 
                        };
                        
                        popup.style.transition = "0.5s";
                        
                        setPosition(popup, pos, def, popup.offsetWidth, 
                            popup.offsetHeight, POPUP_MARGIN, false, true);
                    }
                }
            });
        }
        function delayCheck(){
            setTimeout(check, 500);
        }

        function show() {
            if (!c9.isReady) 
                return c9.on("ready", function(){ setTimeout(show); });
            
            draw();

            thingies.forEach(function(def){
                if (!def.thingy) return;
                
                if (!def.el.offsetWidth && !def.el.offsetHeight) {
                    delete def.el;
                    return;
                }
                
                def.thingy.style.display = "block";
            });

            emit("show");
            showing = true;
            
            enable();
        }

        function hide() {
            if (!drawn) return;

            thingies.forEach(function(def){
                if (!def.thingy) return;
                
                def.thingy.style.display = "none";
                def.thingy.classList.remove("active");
                delete def.shown;
            });
            hidePopup();

            currentPopup = null;
            settings.set("user/tour/@complete", true);

            emit("hide");
            showing = false;
            
            disable();
        }

        /***** Lifecycle *****/

        plugin.on("load", function() {
            load();
        });
        plugin.on("unload", function() {
            drawn = false;
            showing = false;
            thingies = null;
            popup = null;
            showing = null;
            currentPopup = null;
        });

        /***** Register and define API *****/

        /**
         * This is an example of an implementation of a plugin.
         * @singleton
         */
        plugin.freezePublicAPI({
            /**
             * @property showing whether this plugin is being shown
             */
            get showing() {
                return showing;
            },

            _events: [
                /**
                 * @event show The plugin is shown
                 */
                "show",

                /**
                 * @event hide The plugin is hidden
                 */
                "hide"
            ],

            /**
             * Show the plugin
             */
            show: show,

            /**
             * Hide the plugin
             */
            hide: hide,
        });

        register(null, {
            "guide": plugin
        });
    }
});