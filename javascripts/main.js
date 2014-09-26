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
        "options-number-format": true
    };
    app.totalRowsInFiles = 0;
    app.theFiles = undefined;
    app.doneParsing = false;

    app.Helpers = {
        allInputsArePresent: function(){
            
            var inputsAreValid = false,
                user = app.user.name,
                pass = app.user.password,
                database = app.user.databaseName;

            if( username!=="" && password!=="" && database!=="" ){
                inputsAreValid = true;
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
                        if(!app.doneParsing) app.totalRowsInFiles++;
                    }
                };
            }
            function csvConverter(file) {
                Papa.parse(file, this.config);       
            }

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
        loadUserDetails: function(username, password, databaseName){
                app.user.name = username;
                app.user.password = password;
                app.user.databaseName = databaseName;
        },
        saveToCloudant: function(){
            if(app.Helpers.allInputsArePresent()){
                
                var user = app.user.name,
                    pass = app.user.password,
                    database = app.user.databaseName; 
                
                app.docs.each(function(model, index){
                    var json = model.attributes;
                    
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
                        data: JSON.stringify(json),
                        xhrFields: {
                          withCredentials:true
                        }
                    }).done(function(resp) {  
                        console.log("done");    
                    }).fail(function(response){   
                        console.log("failed");  
                    });
                });
            }else{
                console.log("inputs are invalid"); 
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

            app.Helpers.loadUserDetails(username, password, databaseName);
//----------------------------------------------------------------- fix this
            $("#front-page, #header").hide();
            new app.OptionsView();
            $("#second-page").show();
//----------------------------------------------------------------
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
            var rows=[];
            console.log(this.collection);
            this.collection.each(function(row){
              rows.push(JSON.stringify(row.toJSON(),null, 5));
            }, this);

            var values = {docs: rows};
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

