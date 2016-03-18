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
            //{
                //name: "workspace", 
                //query: ".workspace",
                //width: 340,
                //attachment: LEFT,
                //where: RIGHT,
                //wherePopup: RIGHT | BOTTOM,
                //color: "blue",
                //title: "Manage and upload files & folders",
                //body: "Here's where all of your project files are. Double click a file to open it and right click for additional options. You can also create, delete, and move files around. <br /><br />Click the settings icon in the top right corner of the Workspace panel for additional options. Drag and drop to upload files and download them by right-clicking.<br /><br /><a href='https://docs.c9.io/docs/file-revision-history' target='_blank'>Read about Restoring Deleted Files</a>"
            //},
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
                width: 350,
                attachment: TOP,
                where: BOTTOM,
                wherePopup: RIGHT | BOTTOM,
                color: "blue",
                title: "All your code is synchronized",
                body: "The code from your Salesforce environment is automatically downloaded and stored in files you can edit. When you change a file, we upload it, validate it, and compile it again. It's as simple as that.<br/><br/>Want full control? Click the little arrow to open the sync menu and uncheck <b>Automatically Synchronize</b>. Now the exchange only happens when you manually trigger it with the circular sync button.<br/><br/><a href='https://cloud9-salesforce.readme.io/docs/workspace-syncing' target='_blank'>More about workspace syncing</a>"
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
                body: "Use the Test panel to get a list of Apex test classes and run them inside the IDE. If a test fails, we show you the error message so you can fix it with ease.<br/><br/>Want to know which tests still need to be written? Right-click and choose <b>Run with Code Coverage</b> to highlight lines that are covered in green and lines which are not covered in red.<br/><br/><a href='https://cloud9-salesforce.readme.io/docs/apex-test-runner' target='_blank'>More about running Apex tests</a>"
            },
            {
                name: "salesforce menu", 
                query: ".menu-salesforce",
                width: 340,
                attachment: TOP,
                where: BOTTOM,
                color: "blue",
                title: "Shortcuts to Salesforce.com",
                body: "At times you may want to use the Salesforce Developer Console. Don't worry, we added some shortcuts to get there quickly.<br/><br/>Use this menu to open <b>Setup</b> and the <b>Developer Console</b> in a new tab.<br/><br/>And when you use these links, you are automatically logged into the right account. No need to remember all those usernames–we got you covered!"
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
                body: "To quickly run SOQL queries or simply fetch some database records, write your query in the Query Force.com window and then press enter. Try it out:<br/><br/><code>&nbsp;SELECT Id, Name FROM User LIMIT 3</code><br /><br /><a href='https://cloud9-salesforce.readme.io/docs/immediate-query-forcecom' target='_blank'>More about the Query Force.com window</a>"
            },
            //{
                //name: "new tab", 
                //query: ".plus_tab_button",
                //width: 360,
                //attachment: LEFT,
                //where: RIGHT | BOTTOM,
                //color: "green",
                //title: "Open a file, terminal, or recent tabs",
                //body: "Click the plus button to open a new tab for a file or terminal instance. You can also open an immediate window for testing Javascript expressions or reopen recently closed tabs.<br /><br /><a href='https://docs.c9.io/docs/immediate-window' target='_blank'>More about the Immediate Window</a>"
            //},
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
                // TODO: can we open this only when the user opens a visualforce page?
                name: "preview", 
                query: ".preview",
                width: 350,
                attachment: TOP,
                where: BOTTOM,
                color: "orange",
                title: "Preview pages as you code",
                body: "Open a Visualforce file and click Preview to open a frame with the live page on salesforce.com. Whenever you save changes, preview refreshes automatically after syncing.<br /><br /><a href='https://cloud9-salesforce.readme.io/v1.0/docs/run-an-application' target='_blank'>More about Previewing Visualforce Pages</a>"
            },
            //{
                //name: "share", 
                //query: ".c9-share",
                //width: 300,
                //attachment: TOP,
                //where: BOTTOM,
                //color: "orange",
                //title: "Share your work with anyone",
                //body: "Click here to invite others to view or edit your code. Changes by guests are uploaded to Salesforce while you're online.<br /><br /><a href='https://docs.c9.io/docs/share-a-workspace' target='_blank'>More about Sharing a Workspace</a>"
            //},
            //{
                //name: "collaborate", 
                //query: ".collab",
                //width: 400,
                //attachment: RIGHT,
                //where: LEFT,
                //color: "orange",
                //title: "Follow and chat with other collaborators",
                //body: "From the Collaboration panel, you can control all users' access to the workspace, see what files users are working on, and use real-time chat.<br /><br /><a href='https://docs.c9.io/docs/share-a-workspace' target='_blank'>More about Sharing a Workspace</a>"
            //},
            {
                name: "outline", 
                query: ".outline",
                width: 320,
                attachment: RIGHT,
                where: LEFT,
                color: "blue",
                title: "Get an outline of your code",
                body: "The Outline panel shows a full list of functions and definitions in your file so you can quickly navigate through your file without reading every line of code. Use ${key:outline} to open the panel and navigate to any definition file system by typing part of the name."
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
