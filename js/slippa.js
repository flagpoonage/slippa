(function(){
	slippa = function(obj){
		var slippaFunction = typeof obj._constructor === 'function';	

		proto = slippaFunction ? obj._constructor : function(attributes) { 
			if(typeof attributes !== 'undefined'){
				this.attributes = attributes;
			}
			this.init(); 
		};

		if(typeof obj.init === 'undefined'){
			proto.prototype.init = function() {};
		}

		for(var i in obj){
			if(obj.hasOwnProperty(i)){
				if(i === 'slippa' && slippaFunction){
					continue;
				}
				proto.prototype[i] = obj[i];
			}
		}		

		if(slippa.initialized){
			proto.prototype.events = slippa.events;
		}

		return proto;
	}

	slippa.initialized = false;

	slippa.SignalObject = slippa({

		_constructor: function(signalKey){
			this.signalKey = signalKey;
			this.listeners = [];
		},

		addListener: function(context, callback){
			this.listeners.push({
				context: context,
				callback: callback
			});
		},

		removeListener: function(context, callback){
			for(var i = 0; i < this.listeners.length; i++){
				if(this.listeners[i].context === context && this.listeners[i].callback === callback){
					this.listeners.splice(i, 1);
					break;
				}
			}
		},

		dispatch: function(data){
			for(var i = 0; i < this.listeners.length; i++){
				this.listeners[i].callback.call(this.listeners[i].context, data);
			}
		}
	});

	slippa.EventObject = slippa({

		_constructor: function(){
			this.signals = {};
		},

		on: function(signalKey, callback, context){
			var signal = this.signals[signalKey];
			if(typeof signal === 'undefined'){
				signal = new slippa.SignalObject(signalKey);
				this.signals[signalKey] = signal;
			}

			signal.addListener(context, callback);
		},

		off: function(signalKey, callback, context){
			var signal = this.signals[signalKey];
			if(typeof signal !== 'undefined'){
				signal.removeListener(context, callback);
			}

			if(signal.listeners.length === 0){
				this.signals[signalKey] = undefined;
				delete this.signals[signalKey];
			}
		},

		out: function(signalKey, data){
			var signal = this.signals[signalKey];
			if(typeof signal !== 'undefined'){
				signal.dispatch(data);
			}		
		}

	});

	slippa.events = new slippa.EventObject();
	slippa.initialized = true;

}).call(this);