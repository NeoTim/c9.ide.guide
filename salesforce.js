define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "settings", "info", "tabManager", "guide"
    ];
    main.provides = ["guide.salesforce"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var settings = imports.settings;
        var tabManager = imports.tabManager;
        var info = imports.info;
        var guide = imports.guide;
        
        /***** Initialization *****/

        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit = plugin.getEmitter();
        
        var RIGHT = 1 << 1;
        var LEFT = 1 << 2;
        var BOTTOM = 1 << 3;
        var TOP = 1 << 4;
        
        var allThingies = [
            {
                name: "navigate", 
                query: ".navigate",
                width: 300,
                attachment: LEFT,
                where: RIGHT,
                color: "green",
                title: "Quickly navigate to files",
                body: "The Navigate panel allows for quick searching and opening of files. Use ${key:navigate} to open the panel then navigate to any file in the file system by typing part of the filename or path.<br /><br /><a href='https://docs.c9.io/docs/navigate' target='_blank'>More about the Navigate Panel</a>"
            },
            {
                name: "sync", 
                query: ".btn-sync",
                width: 380,
                attachment: TOP,
                where: BOTTOM,
                wherePopup: RIGHT | BOTTOM,
                color: "blue",
                title: "All your code is synchronized",
                body: "Code from your Salesforce environment is automatically downloaded and stored in files for you to edit. When you change a file, it is uploaded, validated, and compiled in the background while you keep coding.<br/><br/>To disable automatic syncing, click the small arrow to open the menu and uncheck <b>Automatically Synchronize</b>. You may then trigger synching with the circular sync button.<br/><br/><a href='https://cloud9-salesforce.readme.io/docs/workspace-syncing' target='_blank'>More about workspace syncing</a>"
            },
            {
                name: "tests", 
                query: ".panelsbutton.test",
                width: 340,
                attachment: LEFT,
                where: RIGHT,
                wherePopup: RIGHT | BOTTOM,
                color: "green",
                title: "Run Apex tests",
                body: "Use the Test panel to get a list of Apex test classes and run them inside the IDE. If a test fails, view the error message and fix it with ease.<br/><br/>To see which tests still need to be written, right-click and choose <b>Run with Code Coverage</b>. This highlights lines that are covered in green and lines that are not covered in red.<br/><br/><a href='https://cloud9-salesforce.readme.io/docs/apex-test-runner' target='_blank'>More about running Apex tests</a>"
            },
            {
                name: "salesforce menu", 
                query: ".menu-salesforce",
                width: 340,
                attachment: TOP,
                where: BOTTOM,
                color: "blue",
                title: "Shortcuts to Salesforce.com",
                body: "Use this menu to open <b>Setup</b> or the <b>Developer Console</b> in a new tab.<br/><br/>Using these links, you are automatically logged into the right account. No need to remember all those usernames!"
            },
            {
                name: "apex immediate", 
                query: function() {
                    var t;
                    if (!tabManager.getTabs().some(function(tab) {
                            if (tab.title == "Apex Force.com" || tab.title == "Immediate (Apex Force.com)") {
                                t = tab;
                                return true
                            };
                        })) return;
                    return t.aml.$button;
                },
                onshow: function(){
                    var t;
                    if (!tabManager.getTabs().some(function(tab) {
                        if (tab.title == "Apex Force.com" || tab.title == "Immediate (Apex Force.com)") {
                            t = tab;
                            return true
                        };
                    })) return;
                    tabManager.activateTab(t);
                },
                width: 460,
                attachment: BOTTOM,
                where: TOP,
                title: "Execute anonymous Apex",
                color: "blue",
                body: "Run small snippets of Apex code in the execute anonymous window and see the output of your code. Try it out:<br/><br/><code>&nbsp;System.debug('Hello ' + UserInfo.getFirstName())</code><br /><br /><a href='https://cloud9-salesforce.readme.io/docs/immediate-apex-forcecom' target='_blank'>More about the Apex Force.com window</a>"
            },
            {
                name: "soql immediate", 
                query: function() {
                    var t;
                    if (!tabManager.getTabs().some(function(tab) {
                            if (tab.title == "Query Force.com" || tab.title == "Immediate (Query Force.com)") {
                                t = tab;
                                return true
                            };
                        })) return;
                    return t.aml.$button;
                },
                onshow: function(){
                    var t;
                    if (!tabManager.getTabs().some(function(tab) {
                        if (tab.title == "Query Force.com" || tab.title == "Immediate (Query Force.com)") {
                            t = tab;
                            return true
                        };
                    })) return;
                    tabManager.activateTab(t);
                },
                width: 400,
                attachment: BOTTOM,
                where: TOP,
                title: "Query data with SOQL",
                color: "green",
                body: "Run SOQL queries or fetch database records by writing your query in the Query Force.com window and pressing enter. Try it out:<br/><br/><code>&nbsp;SELECT Id, Name FROM User LIMIT 3</code><br /><br /><a href='https://cloud9-salesforce.readme.io/docs/immediate-query-forcecom' target='_blank'>More about the Query Force.com window</a>"
            },
            {
                name: "terminal", 
                query: function() {
                    var t;
                    if (!tabManager.getTabs().some(function(tab) {
                            if (tab.editorType == "terminal") {
                                t = tab;
                                return true
                            };
                        })) return;
                    return t.aml.$button;
                },
                width: 300,
                attachment: BOTTOM,
                where: TOP,
                title: "Full Linux terminal",
                color: "blue",
                body: "With full sudo access in the terminal, you can create files, run code, and install software. Open a new terminal at any time with ${key:openterminal}.<br /><br /><b>Pro Tip</b>: Your workspace layout is fully customizable, making split screen simple. Try dragging this terminal tab and dropping it all over the screen. This works for many tabs and many layouts.<br /><br /><a href='https://docs.c9.io/docs/terminal' target='_blank'>More about the Terminal</a>"
            },
            {
                name: "preview", 
                query: ".preview",
                width: 350,
                attachment: TOP,
                where: BOTTOM,
                color: "orange",
                title: "Preview pages as you code",
                body: "Open a Visualforce file and click Preview to open a frame with the live page on salesforce.com. Whenever you save changes, preview refreshes automatically after syncing.<br /><br /><a href='https://cloud9-salesforce.readme.io/v1.0/docs/run-an-application' target='_blank'>More about Previewing Visualforce Pages</a>"
            },
            {
                name: "outline", 
                query: ".outline",
                width: 320,
                attachment: RIGHT,
                where: LEFT,
                color: "blue",
                title: "Get an outline of your code",
                body: "The Outline panel shows a full list of functions and definitions in your file so you can quickly navigate through your file without reading every line of code. Use ${key:outline} to open the panel and navigate to any definition by typing part of the name."
            },
        ];

        function load() {
            guide.add(allThingies);
            
            guide.on("hide", function(e){
                settings.set("user/tour/@salesforce-complete", true);
            });
            
            guide.on("close", function(e){
                var completed = settings.getJson("user/tour/salesforce") || {};
                completed[e.name] = 1;
                settings.setJson("user/tour/salesforce", completed);
            });
            
            settings.on("read", function(){
                settings.setDefaults("user/tour", [["salesforce-complete", false]]);
                
                var dateGuideDeployed = new Date(2015, 3, 11).getTime();
                if (!settings.getBool("user/tour/@salesforce-complete") && info.getUser().date_add > dateGuideDeployed)
                    guide.show(settings.getJson("user/tour/salesforce"));
            });

            guide.show(false);
        }

        /***** Lifecycle *****/

        plugin.on("load", function() {
            load();
        });
        plugin.on("unload", function() {
        });

        /***** Register and define API *****/

        plugin.freezePublicAPI({});

        register(null, {
            "guide.salesforce": plugin
        });
    }
});
