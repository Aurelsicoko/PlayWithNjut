var player = {

	params : {
		audio : '#player',
		progress : '#progress',
		buffer : '#buffer',
		control : '#control',
		button : '#button',
		file : '',
		loaded : function(){},
		playing : function(){},
		pause : function(){},
		ended : function(){},
		initied : function(){}
	},

	init : function(options){
		this.property = $.extend(this.params, options);
		this.media = $(this.property.audio)[0];
		this.media.src = this.params.file;
		player.property.initied.call(this);

		$(this.media).on('ended', function(){
			player.end();
		});
		console.log(this.media);
	},

	load : function(){
		this.media.load();
		this.media.addEventListener('canplaythrough', handler, false);
	},

	play : function(){
		this.media.play();
		this.media.removeEventListener('canplaythrough', handler, false);
		this.property.playing.call(this);
		socket.emit('debutPartie');
	},

	pause : function(){
		this.media.pause();
		this.property.pause.call(this);
		socket.emit('pausePartie');
	},

	end : function(){
		this.property.ended.call(this);
	},

	setFile : function(file){
		this.params.file = file;
		this.media.src = this.params.file;
		console.log("src changé");
	},

	clic : function(){
		console.log("click");
		var ter = this.media.paused?this.play():this.pause();
	}

};

function handler(){
	console.log('canplaythrough');
	player.property.loaded.call(this);
}
