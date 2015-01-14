/* slippa Library - James Hay 2014 - v0.4*/
;(function(){
	"use strict";
	var __fn = 'function',
	    __ud = 'undefined',
	    __init = false,
	    __rsv = ['_opt','_constructor'];

	var __reserved = function(key){
		for(var i = 0; i < __rsv.length; i++){
			if(key === __rsv[i]){ return true };
		}
		return false;
	};

	// Slippa object constructor
	var slippa = function(o){

		!o._opt && (o._opt = {
			noProxy: false,
			noEvents: false,
			noAppEvents: false,
			noProtoEvents: false,
		})

		// Small object names
		var hasContructor = typeof o._constructor === __fn;

		var incl = {
			proxy: !o._opt.noProxy,
			events: !o._opt.noEvents,
			appevents: !o._opt.noAppEvents,
			protoevents: !o._opt.noProtoEvents,
		};
 
		// Universal init function.
		var universalInitFn = function(){

			incl.proxy && (_configureProxy.call(this));

			if(typeof this.respond === __fn){

				// Only configure responsive handling if a respond function is defined.
				_configureResponder.call(this);
			}
			if(typeof _EventObject !== __ud && __init && incl.events){

				// Per instance event object
				this.events = new _EventObject();
			}			
		}

		// Create the constructor function for the defined object wrapping the defined _constructor function if one has been provided.
		var p = hasContructor ? 
		(function SlippaObject(){
			universalInitFn.call(this);
			this._constructor.apply(this, arguments);
			this.init();
		}) : 
		(function SlippaObject(){
			universalInitFn.call(this);
			this.init();
		});

		var pp = p.prototype;

		if(typeof o.init === __ud){
			// Init is always called, so if an init function is not defined, we define an empty function here
			pp.init = function() {};
		}

		for(var i in o){
			if(o.hasOwnProperty(i)){
				if(!__reserved[i])
				// Build the prototype object from the defined methods and properties.
				pp[i] = o[i];
			}
		}		

		if(__init){
			// Application-wide event object
			incl.appevents && (pp.appevents =  __events);

			// Per prototype event object
			incl.protoevents && (pp.protoevents = new _EventObject());
		}

		return p;
	};

	// Configure an object instance to respond to application size-changing events.
	var _configureResponder = function(){

		this.isMobile = false;
		this.currentSize = -1;
		this.appevents.on('size:respond', _respondInternal.call(this), this);
	};

	// Returns the context assigned internal respond function which will call the user-defined respond function.
	var _respondInternal = function(){

		return function(width){

			// TODO: User-defined responsive capabilities.
			this.previousSize = this.currentSize;
			this.currentSize = width;
			this.isMobile = this.currentSize < 768;

			// Call the user defined respond function.
			this.respond({
				width: this.currentSize,
				fromMobile: this.previousSize < 768 && this.currentSize >= 768,
				fromTablet: this.previousSize === 768,
				toTablet: this.currentSize === 768,
				toMobile: (this.previousSize >= 768 || this.previousSize === -1) && this.currentSize < 768
			});
		}
	};

	// Configures a context assigned proxy function for each user-defined function.
	var _configureProxy = function(){
		this.proxy = {};
		for(var i in this){
			if(typeof this[i] === __fn){
				this.proxy[i] = _proxy.call(this, this[i]);
			}
		}		
	}

	// Returns the context assigned internal proxy function for a user-defined function.
	var _proxy = function(fn){
		return (function(self){
			return function(){
				fn.apply(self, arguments);
			}
		})(this);
	};

	// Represents a single named signal and provides the underlying calls for callbacks associated with that signal.
	var _SignalObject = slippa({
		_opt: {
			noProxy: true,
			noEvents: true,
			noAppEvents: true,
			noProtoEvents: true,			
		},

		// Constructor
		_constructor: function(key){
			this.key = key;
			this.listeners = [];
		},

		// Adds a new callback function with a specified context to this signal
		addListener: function(context, callback){
			this.listeners.push({
				context: context,
				callback: callback
			});
		},

		// Removes athe callback function with the specific context
		removeListener: function(context, callback){
			for(var i = 0; i < this.listeners.length; i++){
				if(this.listeners[i].context === context && this.listeners[i].callback === callback){
					this.listeners.splice(i, 1);
					break;
				}
			}
		},

		// Runs each callback function assigned to the signal, supplying the data provided to the event.out function.
		dispatch: function(data){
			for(var i = 0; i < this.listeners.length; i++){
				this.listeners[i].callback.call(this.listeners[i].context, data);
			}
		},

		// Runs each callback function assigned to the signal, collecting the results of each, and returning a result object.
		// This provides a decoupled method for unrelated components to have simple 2-way communication.
		ask: function(data){
			var res = [];
			res.result = true;
			for(var i = 0; i < this.listeners.length; i++){
				res.push({
					result: this.listeners[i].callback.call(this.listeners[i].context, data),
					content: this.listeners[i].context});
			}			

			// If any results are false, the result object should have an overally status of false.
			for(var i = 0; i < res.length; i++){
				if(!res[i].result){
					res.result = false;
					break;
				}
			}

			return res;
		}
	});

	// Represents a set of signals in any scope of the application
	var _EventObject = slippa({
		_opt: {
			noProxy: true,
			noEvents: true,
			noAppEvents: true,
			noProtoEvents: true,			
		},

		// Constructor
		_constructor: function(){
			this.signals = {};
		},

		// Assigns a contextual callback function to the matching signal in this event object.
		on: function(key, callback, context){
			var signal = this.signals[key];
			if(typeof signal === 'undefined'){
				signal = new _SignalObject(key);
				this.signals[key] = signal;
			}

			signal.addListener(context, callback);
		},

		// Removes a contextual callback function from the matching signal in this event object.
		off: function(key, callback, context){
			var signal = this.signals[key];
			if(typeof signal !== 'undefined'){
				signal.removeListener(context, callback);

				if(signal.listeners.length === 0){
					this.signals[key] = undefined;
					delete this.signals[key];
				}
			}
		},

		// Calls a dispatch on the matching signal in this event object.
		out: function(key, data){
			var signal = this.signals[key];
			if(typeof signal !== 'undefined'){
				signal.dispatch(data);
			}		
		},

		// Runs an 'ask' based dispatch on the matching signal in this event object and returns the aggregated callback results.
		ask: function(key, data){
			var signal = this.signals[key];
			if(typeof signal !== 'undefined'){
				return signal.ask(data);
			}		

			return {result: true};
		}
	});

	var __events = new _EventObject();
	__init = true;

	this.slippa = slippa;
	this.slippaEvents = __events;

}).call(this);