function region() {
	this.capital = -1;
	this.cells = [];
	this.bank = 0;
	this.troops = [];

	this.tax = tax;
	function tax() {
		this.bank += this.cells.length;
	}
}
