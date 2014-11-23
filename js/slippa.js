/* SLippa Library - James Hay 2014 - v0.2*/
;(function(){
	slippa = function(o){
		var sFn = typeof o._constructor === 'function';	
		var sCp = slippa._configureProxy;
		var sCr = slippa._configureResponder;		

		if(sFn){
			var SlippaObject = (function(){
				function SlippaObject(){
					sCp.call(this);

					if(typeof this.respond === 'function'){
						sCr.call(this);
					}

					this._constructor.apply(this, arguments);
					this.init();
				}

				return SlippaObject;
			})();
		}
		else{
			var SlippaObject = (function(){
				function SlippaObject(){
					sCp.call(this);

					if(typeof this.respond === 'function'){
						sCr.call(this);
					}

					this.init();
				}

				return SlippaObject;
			})();
		}

		p = SlippaObject;
		var pp = p.prototype;

		if(typeof o.init === 'undefined'){
			pp.init = function() {};
		}

		for(var i in o){
			if(o.hasOwnProperty(i)){
				if(i === 'slippa' && sFn){
					continue;
				}

				pp[i] = o[i];
			}
		}		

		if(slippa.initialized){
			pp.appevents = slippa.events;
			pp.events = new slippa.EventObject();
		}

		return p;
	};

	slippa.config = {
		respondSizes: []
	};

	// TODO: Wire this up.
	slippa.configure = function(config){
		this.config.respondSizes = config.respondSizes || [];
		if(this.config.respondSizes.length > 0){

		}
	};

	slippa._configureResponder = function(){
		this.isMobile = false;
		this.currentSize = -1;
		this._responderInitialized = false;
		this.appevents.on('size:respond', slippa._respondInternal.call(this), this);
	};

	slippa._respondInternal = function(){
		return function(width){
			this.previousSize = this.currentSize;
			this.currentSize = width;
			this.isMobile = this.currentSize < 768;

			this.respond({
				fromMobile: this.previousSize < 768 && this.currentSize >= 768,
				toMobile: (this.previousSize >= 768 || this.previousSize === -1) && this.currentSize < 768
			});
		}
	};

	slippa._configureProxy = function(){
		this.proxy = {};
		for(var i in this){
			if(typeof this[i] === 'function'){
				this.proxy[i] = slippa.proxy.call(this, this[i]);
			}
		}		
	}

	slippa.proxy = function(fn){
		return (function(self){
			return function(){
				fn.apply(self, arguments);
			}
		})(this);
	};

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
		},

		ask: function(data){
			var res = [];
			res.result = true;
			for(var i = 0; i < this.listeners.length; i++){
				res.push({
					result: this.listeners[i].callback.call(this.listeners[i].context, data),
					content: this.listeners[i].context});
			}			

			for(var i = 0; i < res.length; i++){
				if(!res[i].result){
					res.result = false;
					break;
				}
			}

			return res;
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

				if(signal.listeners.length === 0){
					this.signals[signalKey] = undefined;
					delete this.signals[signalKey];
				}
			}
		},

		out: function(signalKey, data){
			var signal = this.signals[signalKey];
			if(typeof signal !== 'undefined'){
				signal.dispatch(data);
			}		
		},

		ask: function(signalKey, data){
			var signal = this.signals[signalKey];
			if(typeof signal !== 'undefined'){
				return signal.ask(data);
			}		

			return true;
		}
	});

	slippa.events = new slippa.EventObject();
	slippa.initialized = true;

}).call(this);