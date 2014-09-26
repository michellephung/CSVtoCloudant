/*

main.js

CSV to Cloudant Web App
Developed by Michelle Phung for Cloudant/IBM
September 13th, 2014

*/


$(function(){

    var app = {};

    //--------------
    // Models
    //--------------
    app.Doc = Backbone.Model.extend({   //this will vary per file
    });

    app.User = Backbone.Model.extend({  //credentials
    });

    app.DropDownItem = Backbone.Model.extend({  //one item per dropdown menu
    });

    app.user = new app.User();  //Singleton
    //--------------
    // Collections
    //--------------
    app.Docs = Backbone.Collection.extend({
        model: app.Doc
    });

    app.DropDownMenus = Backbone.Collection.extend({
        model: app.DropDownItem
    });
    
    app.docs = new app.Docs();
    app.dropDownMenus = new app.DropDownMenus();    

    //-------------------
    //  Helper Functions
    //-------------------
    app.userSelections = {
        "options-delimiter": undefined,
        "options-number-of-lines": undefined,
        "options-header": true,
        "options-doc-load-format": "rows",
        "options-number-format": true
    };

    app.totalRowsInFiles = 1;   //intially starts with file having a header line
    app.theFiles = undefined;
    app.doneParsing = false;
    app.oneDoc = { data: {} };

    app.Helpers = {
        ajaxCalltoCloudant: function(data, user, pass, database){
            $.ajax({
                type: "POST",
                beforeSend: function(xhr) { 
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(user + ":" + pass)); 
                },
                name: user,
                password: pass,
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                url: "https://"+user+".cloudant.com/"+database,
                data: data,
                xhrFields: {
                  withCredentials:true
                }
            }).done(function(resp) {  
                console.log("done");  
                $('#load').html("<span id='load_success'>Loaded!</span>");  

            }).fail(function(response){   
                console.log("failed"); 
                $('#load').html("<span id='load_fail'>Failed</span>");
            });
        },
        allInputsArePresent: function(username, password, databaseName){
            
            var inputsAreValid = false,
                files = app.theFiles;
            if( username!=="" && password!=="" && databaseName!=="" && files !== undefined ){
                inputsAreValid = true;
                app.user.name = username;
                app.user.password = password;
                app.user.databaseName = databaseName;
            }
            return inputsAreValid;
        },
        cvsToJSON: function(){
            var config,
                converter,
                files;

            function buildConfig(){
                return {
                    delimiter: app.userSelections['options-delimiter'],
                    header: app.userSelections['options-header'],
                    dynamicTyping: app.userSelections['options-number-format'],
                    preview: parseInt(app.userSelections['options-number-of-lines']),
                    step: function(results, handle) {
                        var json = results.data[0],
                            newDoc = new app.Doc(json);
                        app.docs.add(newDoc);   
                        if(app.userSelections["options-doc-load-format"] ==  "file"){
                            app.oneDoc.data[Object.keys(app.oneDoc.data).length]=json;
                        }
                        if(!app.doneParsing) app.totalRowsInFiles++;
                    }
                };
            }
            function csvConverter(file) {
                Papa.parse(file, this.config);       
            }
            app.oneDoc.data = {};   //clear data
            files = app.theFiles;       // fetch FileList object
            config = buildConfig();
            converter = _.bind(csvConverter, {'config': config } ); 
            _.each(files, converter);   // process all File objects
        },
        loadDropdownChoices: function(){

            app.delim = new app.DropDownItem({
                id: "options-delimiter",
                title:"Delimiter",
                choices:[
                    {
                        visible:"automatic",
                        value:"automatic"   
                    },
                    {   visible:"comma ( , )",
                        value:","
                    },
                    {   visible:"tab ( [tab] )",
                        value:"\t"
                    },
                    {   visible:"semicolon ( ; )",
                        value:";"
                    },
                    {   visible:"colon ( ; )",
                        value:";"
                    },
                    {   visible:"hyphen ( - )",
                        value:"-"
                    }
                ]
            });
            
            app.header = new app.DropDownItem({
                id: "options-header",
                title:"First Line is Header",
                choices:[
                    {   visible:"First Line is Header",
                        value:true
                    },
                    {   visible:"No Header",
                        value:false
                    }
                ]
            });

            app.load_doc_by = new app.DropDownItem({
                id: "options-doc-load-format",
                title:"One document per row",
                choices:[
                    {   visible:"One document per row",
                        value:"rows"
                    },
                    {   visible:"One document per file",
                        value:"file"
                    }
                ]
            });
            app.numbers_are = new app.DropDownItem({
                id: "options-number-format",
                title:"Numbers are values",
                choices:[
                    {   visible:"Numbers are values",
                        value:true
                    },
                    {   visible:"Numbers are strings",
                        value:false
                    }
                ]
            });
            app.dropDownMenus.add([app.delim, app.header, app.load_doc_by, app.numbers_are ]);
        },
        saveToCloudant: function(){    
            var user = app.user.name,
                pass = app.user.password,
                database = app.user.databaseName; 

            if(app.userSelections["options-doc-load-format"] ==  "file"){
                app.Helpers.ajaxCalltoCloudant(JSON.stringify(app.oneDoc), user, pass, database);
            }else{
                app.docs.each(function(model, index){
                    var json = model.toJSON();
                    app.Helpers.ajaxCalltoCloudant(
                        JSON.stringify(json), 
                        user, pass, database
                        )
                    ;
                });
            }
        },
        updatePreview: function(){
            app.docs.reset();
            app.doneParsing = true;
            app.Helpers.cvsToJSON();
            new app.PreviewTableView({ collection: app.docs });
        },
        updateUserSelections: function(id, choice){

            var userchoice = choice;

            if(choice == "true"){
                userchoice = true;
            }
            if(choice == "false"){
                userchoice = false;
            }
            if(choice == "automatic"){
                userchoice = undefined;
            }
            app.userSelections[id] = userchoice;
        }
    }

    //--------------
    // Views
    //--------------
    app.FileDrop= Backbone.View.extend({
        el: "#file-drop-box",
        initialize: function(){
            $(this.el).css("display", "block");  
        },
        events: {
            'dragover': 'FileDragHover',
            'dragleave .drop-mask': 'FileDragLeave',
            'drop .drop-mask': 'FileDrop'
        },
        FileDragHover: function(e){
            this.StopEvents(e);
            e.type == "dragover" ? $(this.el).addClass("hover") : $(this.el).removeClass();
            this.$('#drop-mask').show();
        },
        FileDragLeave: function(e){
            this.StopEvents(e);
            $(this.el).removeClass("hover");
            this.$('#drop-mask').hide();
        },
        FileDrop: function(e){
            this.FileDragLeave(e);
            this.$('#instructions').html("File captured");
            this.$el.css("border-style", "solid");
            this.undelegateEvents();    //unbinds events for file drop, refresh page to add a different file
            app.theFiles = e.originalEvent.dataTransfer.files;  // attaches file to app object
            app.Helpers.cvsToJSON();   // puts CVS into Model
        },
        StopEvents: function(e){
            e.stopPropagation();
            e.preventDefault();
        }       
    });

    app.UserInputView = Backbone.View.extend({
        el: "#user-inputs",
        events:{
            'click .start' : 'start'
        },
        start: function(){
            var username = this.$("#username").val(),
                password = this.$("#password").val(),
                databaseName = this.$("#DBName").val();

            if(app.Helpers.allInputsArePresent(username, password, databaseName )){

                $("#front-page, #header").hide();
                new app.OptionsView();
                $("#second-page").show();
            }else{
                var errorMessage = "";

                if(app.theFiles == undefined){
                    errorMessage = "No File attached. <br>";
                }
                if(username == ""){
                    errorMessage += "Please enter your username. <br>";
                }
                if(password == ""){
                    errorMessage += "Please enter your password. <br>";
                }
                if(databaseName == ""){
                    errorMessage += "Please enter your database name. <br>";
                }

                this.$('#startErrorMessage').html(errorMessage);
            }
            
        }
    });

   app.DropDownView = Backbone.View.extend({
        template: _.template($("#dropdown-menu-template").html()),
        initialize: function(){
            $(document).bind('click', function(e) {
                var $clicked = $(e.target);
                if (! $clicked.parents().hasClass("dropdown")){
                    $(".dropdown dd ul").hide();
                }   
            });
            this.render();
        },
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
        },
        events:{
            'click .dropdown dt a': 'viewMenu',
            'click .dropdown dd ul li a': 'selectChoice'
        },
        viewMenu: function(){
            this.$el.find(".dropdown dd ul").toggle();
        },
        selectChoice:function(e){
            var text = e.toElement.innerHTML;
            this.$(".dropdown dt a span").html(text);
            this.$(".dropdown dd ul").hide();

            app.Helpers.updateUserSelections(this.id, this.getSelectedValue());
            app.Helpers.updatePreview();
        },
        getSelectedValue: function(e){
            return this.$el.find("dt a span.value").html();
        }
   });
   
   app.OptionsView = Backbone.View.extend({
        el: '#options-wrapper',
        initialize: function(){
            new app.HowManyRowsView();
            app.Helpers.loadDropdownChoices();
            this.$('#loadIntoDBName').html(app.user.databaseName);
            app.dropDownMenus.each(function(menu){
                new app.DropDownView({  
                            model: menu,
                            el:$("#"+menu.get('id')),
                            id: menu.get('id')
                        });
            });
        }
   });

   app.HowManyRowsView = Backbone.View.extend({
        el: "#options-number-of-lines",
        initialize: function(){ 
            var totalLines = app.totalRowsInFiles;
            this.$('#number-of-lines-to-get').attr({
                min: 1,
                max: totalLines
            });
            this.$('#number-of-lines').html(totalLines);
        },
        events:{
            "change input" : "update"
        },
        update: function(){
            app.Helpers.updateUserSelections(this.$el.attr('id'), this.$('#number-of-lines-to-get').val());
            app.Helpers.updatePreview();
        }
   });

   app.PreviewTableView = Backbone.View.extend({
        el: "#preview-table",
        template: _.template($("#table").html()),
        initialize: function(){
            var that = this;
            this.$el.html("");
            this.collection.bind("add", function(){
                that.render();
            });
        },
        getHeaderValues: function(){
            var first = this.collection.first();
            return Object.keys(first.toJSON());
        },
        getRows: function(){
            var rows = [];
            this.collection.each(function(row){
                rows.push(row.toJSON());
            }, this);
            return rows;
        },
        render: function(){
            var values = {
                header: this.getHeaderValues(),
                rows: this.getRows()
            }
            this.$el.html(this.template(values));
        }
   });

   app.JSONView = Backbone.View.extend({
        el:"#JSONView",
        template: _.template($('#JSONView-template').html()),
        initialize: function(){
            var that = this;
            this.collection.bind("add", function(){
                that.render();
            });
        },
        render: function(){
            var rows=[], values;
            if(app.userSelections["options-doc-load-format"] ==  "rows"){
                this.collection.each(function(row){
                    rows.push(JSON.stringify(row.toJSON(),null, 5));
                });
                values = {docs: rows};
            }else{
                values = {docs: [ JSON.stringify(app.oneDoc,null, 5)  ]};
            }
            this.$el.html(this.template(values));
        }
   });

   app.previewSelectionView = Backbone.View.extend({
        el:"#viewSelection",
        initialize: function(){
            $("#JSONView").hide();
        },
        events:{
            "click #viewTable": "viewTable",
            "click #viewJSON": "viewJSON"
        },
        viewJSON: function(){
            this.$("#preview-table").hide();
            this.$("#JSONView").show();
        },
        viewTable: function(){;
            this.$("#JSONView").hide();
            this.$("#preview-table").show();
        }
   });

   app.LoadButtonView = Backbone.View.extend({
        el: "#load",
        events:{
            'click': 'load'
        },
        load: function(){
            app.Helpers.saveToCloudant();
            this.undelegateEvents();
            this.$el.html("Loading...");
            this.$el.hover(function(){
                $(this).css('text-decoration', 'none');
            });
        }
   });

    app.AppView = Backbone.View.extend({
        initialize: function(){
            new app.FileDrop();
            new app.UserInputView();
            new app.PreviewTableView({ collection: app.docs });
            new app.JSONView({ collection: app.docs });
            new app.LoadButtonView();
            new app.previewSelectionView();
        }
    });

    //--------------
    // Initializers
    //-------------- 
    app.appView = new app.AppView();
});

