var ItemrecEngineSettingsModel = Backbone.Model.extend({
	/* Required params: app_id, id (engine_id) */
	urlRoot: function(){ 
		return '/modules/itemrec/settings/app/'+ this.get("app_id") +'/engine';
	}
});

var ItemrecSettingsView = Backbone.View.extend({
	el: '#itemrecContentHolder', 
	initialize : function() {
		this.subViews = []; // keep track of sub view
		this.template = _.template($("#itemrecTemplate").html());
		this.index = 0;
		this.engine_id = this.options.engine_id;
		this.app_id = this.options.app_id;
		this.itemtypelist = {}; // storing itemtypes
		var self = this;
		this.model = new ItemrecEngineSettingsModel({app_id: this.app_id, id: this.engine_id});
		this.model.fetch({
			success: function() {
				self.render();
				
				// load itemtypes to this.itemtypelist and display it
				var currItemTypeList = self.model.get('itemtypelist');
				if (currItemTypeList) {
					for (var i=0;i < currItemTypeList.length; i++) {
						var currItemtype_id = currItemTypeList[i];
						self.itemtypelist[currItemtype_id] = true;
						self.addItemTypeView(currItemtype_id);
					}
				}
				var goal = self.model.get('goal');
				self.$el.find('#itemrecGoal').val(goal);
			}
		});
	},
	events : {
		"click #itemrecAddItemTypeBtn" : "addItemType",
		'keypress #itemrecAddItemTypeInput': 'onEnterAddItemType',
		"change #itemrecGoal": "goalSelected",
		"click #recsys-unseenonly-yes" : "setUnseenOnlyYes",
		"click #recsys-unseenonly-no" : "setUnseenOnlyNo"
	},
	onEnterAddItemType : function(e) {
		if (e.keyCode == 13) { // if it's ENTER
			this.addItemType();
			return false;
		} else { // continue if it's not ENTER
			return true;
		}
	},
	addItemType : function() {
		var inputObj = this.$el.find('#itemrecAddItemTypeInput');
		var itemtype_id = inputObj.val();
		// add itemtype
		this.itemtypelist[itemtype_id] = true;
		this.model.set({
			itemtypelist: MapKeyToArray(this.itemtypelist),
			allitemtypes: false
		});
		var self = this;
		this.model.save({},{
			success: function(model, res) {
				self.addItemTypeView(itemtype_id);
				inputObj.val(''); // clear input field
				self.$el.find('#itemrecAllItemTypes').attr('checked', false); // unselect include all
			}
		});
		return false;
	},
	addItemTypeView: function(itemtype_id){
		var itemTypeView = new ItemrecSettingsItemTypeView({ itemtype_id: itemtype_id, index: this.index});
		this.$el.find('#itemrecItemTypeList_ContentHolder').append(itemTypeView.render().el);
		this.subViews.push(itemTypeView);
		this.listenTo(itemTypeView, 'ItemTypeRemoved', this.itemtypeRemoved);
		this.index += 1;
	},
	itemtypeRemoved: function(itemtype_id) {
		if (itemtype_id in this.itemtypelist) {
			delete this.itemtypelist[itemtype_id];
			this.model.set({itemtypelist: MapKeyToArray(this.itemtypelist)});
			this.model.save();
		}
	},
	goalSelected: function(e) {
		var goal = this.$el.find('#itemrecGoal').val();
		this.model.set({goal: goal});
		this.model.save();
		return false;
	},
	setUnseenOnlyYes: function(e) {
		this.model.set({unseenonly: true});
		this.model.save();
		this.$el.find('#recsys-unseenonly-text').html('Yes');
	},
	setUnseenOnlyNo: function(e) {
		this.model.set({unseenonly: false});
		this.model.save();
		this.$el.find('#recsys-unseenonly-text').html('No');
	},
	render : function() {
		this.$el.html(this.template({'data': this.model.toJSON()}));
		var self = this;
		var freshness = self.model.get('freshness');
		
		this.$el.find("#slider-freshness").slider({
			value : freshness,
			min : 0,
			max : 10,
			step : 1,
			slide : function(event, ui) {
				self.model.set({freshness: ui.value});
				self.model.save({}, {success: function(){
					self.$el.find("#slider-freshness-val").text(ui.value);	
				}});
			}
		});
		this.$el.find("#slider-freshness-val").text(freshness);

		var serendipity = self.model.get('serendipity');
		this.$el.find("#slider-serendipity").slider({
			value : serendipity,
			min : 0,
			max : 10,
			step : 1,
			slide : function(event, ui) {
				self.model.set({serendipity: ui.value});
				self.model.save({}, {success: function(){
					self.$el.find("#slider-serendipity-val").text(ui.value);	
				}});
			}
		});
		this.$el.find("#slider-serendipity-val").text(serendipity);
		return this;
	},
	reloadData : function() { // Required Engine Module Function
	},
	close : function() {  // Required Engine Module Function
		try {
			this.$el.find("#slider-freshness").slider( "destroy" );
			this.$el.find("#slider-serendipity").slider( "destroy" );
		} catch(e){};
		
		this.remove();
		this.off();
		// handle other unbinding needs, here
		_.each(this.subViews, function(subView){
			if (subView.close){
				subView.close();
			}
		});
	}
});

/* Required Param: itemtype_id, index*/
var ItemrecSettingsItemTypeView = Backbone.View.extend({
	tagName: 'tr',
    initialize: function(){
    	this.template_el = '#itemrecItemTypeList_template';
    	this.template = _.template($(this.template_el).html()); // define template function
    	this.itemtype_id = this.options.itemtype_id;
    	this.index  = this.options.index;
    },
	events : {
		"click .removeItemTypeBtn" : "removeItemType"
	},
    render: function(){
        //this.$el.html( this.template({"data": this.model.toJSON()}) );
    	this.$el.html( this.template({"data": {
    		itemtype_id: this.itemtype_id,
    		index: this.index
    	}}) );
        return this;
    },
    removeItemType: function() {
    	this.remove();
    	this.trigger('ItemTypeRemoved', this.itemtype_id);
    	return false;
    }
});

var createEngineView = function(app_id, engine_id) { // Required Engine Module Function
	return new ItemrecSettingsView({app_id: app_id, engine_id: engine_id});
};

