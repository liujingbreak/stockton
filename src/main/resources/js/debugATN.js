var fs = require('fs');
var _ = require('./lodash');

var fname = 'ATNGraph.html';
var row = 0;
var drawedStates = {};

function debugATN(compiler){
	writeHTMLStart();
	fs.appendFileSync(fname, '<svg version="1.1" '+
     'baseProfile="full"' +
     ' width="3000" height="3000"'+
     ' xmlns="http://www.w3.org/2000/svg">\n');
	var lexStart = compiler.atn.states[0];
	drawState(lexStart, 0);
	
	
	
	fs.appendFileSync(fname, '\n</svg>\n</body></html>');
}



function drawState(state, col){
	var r = 30, x = col * 80 + r, y = row * 80 + r;
	var cCol = col, cRow = row;
	var drawed = drawedStates[state.stateNumber];
	//if(drawed){
	//	line(col, row, drawed[0], drawed[1]);
	//	//fs.appendFileSync(fname, '<circle id="'+ col + ':' + row +'" class="drawed" cx="'+ x  +'" cy="'+ y +'" r="'+ (r - 1) +'" stroke="black" stroke-width="1"/>\n' + 
	//	//'<text x="'+ x+'" y="'+ y +'">S: '+ state.stateNumber + '</text>\n');
	//	return false;
	//}
	fs.appendFileSync(fname, '<circle id="'+ col + ':' + row +'" cx="'+ x  +'" cy="'+ y +'" r="'+ (r - 1) +'" stroke="black" stroke-width="1"/>\n' + 
		'<text x="'+ x+'" y="'+ y +'">S: '+ state.stateNumber + '</text>\n'+ 
		'<text class="type" x="'+ x+'" y="'+ (y + 13) +'">'+ state.type + '</text>');
	if((state.type === 'ruleStart' || state.type === 'ruleStop' ) && state.ruleName)
		fs.appendFileSync(fname, '<text class="name" x="'+ x+'" y="'+ (y - 13) +'">'+ state.ruleName + '</text>\n');
	//console.log('state %s: transition num: %d', state.stateNumber, state.transitions.length);
	drawedStates[state.stateNumber] = [col, row];
	if(state.transitions && state.transitions.length > 0){
		
		_.each(state.transitions, function(value, index){
				if(index > 0)
					row ++;
				var drawed = drawedStates[value.target.stateNumber];
				if(!drawed){
					line(cCol, cRow, col + 1, row);
					drawState(value.target, col + 1);
				}else{
					line(cCol, cRow, drawed[0], drawed[1]);
				}
				
		});
	}
	return true;
}

function line(col0, row0, col1, row1){
	var r = 30, x0 = col0 * 80 + r, y0 = row0 * 80 + r,
		x1 = col1 * 80 + r, y1 = row1 * 80 + r;

	
	if(row0 == row1){
		if(col0 +1 === col1){
			//short staight line
			var s = 'M ' + (x0 + r) + ' '+ y0 +' '+ (x1 - r) +' '+ y1;
		}else{
		//we need a beautiful curve here
			var s = 'M ' + x0 + ' '+ (y0 + r) + ' C '+ x0 +' '+ (y0 + 60) + ','+ x1 +' '+ (y1 + 60) + ', ' + x1 +' '+ (y1 + r);
		}
	}else{ // 2 straight lines will do just fine
		if(row1 > row0){
			if(col1 > col0)
				var s = 'M ' + x0 + ' '+ (y0+r) + ' V '+ y1+ ' H '+ (x1 -r) ;
		}else{
			if(col0 > col1)
				var s = 'M ' + x0 + ' '+ (y0 - r) + ' L '+ x1 + ' '+ (y1 + r);
			else
				var s = 'M ' + (x0 + r) + ' '+ y0 + ' H '+ x1 + ' V '+ (y1 + r);
		}
	}
	fs.appendFileSync(fname, '<path d="'+ s +'" class="transition" />');
}

function writeHTMLStart(){
	var styles = fs.readFileSync('../ATNGraph.css', 'utf-8');
	var s = '<!doctype html>\n';
	s += '<html>\n';
	s += '<head>\n';
	s += '<title>XTech SVG Demo</title>\n';
	s += '<style>\n';
	s += styles;
	s += '</style>\n';
	s += '<body>\n';
	fs.writeFileSync(fname, s);
}

exports.debugATN = debugATN;
