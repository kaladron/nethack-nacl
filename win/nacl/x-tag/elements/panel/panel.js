
(function(){
	
	xtag.register('x-panel', {
		mixins: ['request'],
		onCreate: function(){
			this.dataready = this.dataready || function(request){
				this.textContent = request.responseText;
			}
		}
	});
	
})();
