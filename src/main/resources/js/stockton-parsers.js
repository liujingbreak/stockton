function JSParser(pegParser, logfunc){
    this.text = null;
    this.pegParser = pegParser;
    this.result = [];
    this.logfunc = logfunc;
}
JSParser.prototype = {
    parse:function(text){
        this.text = text;
        var now = new Date().getTime();
        var tree = this.pegParser.parse(text);
        if(this.logfunc)
            this.logfunc("duration of peg: "+ (new Date().getTime() - now));
        //console.log(JSON.stringify(process.memoryUsage()));
        this._travelTree(tree);
        //console.log(JSON.stringify(tree, null, '  '));
        delete this.text;
        return this.result;
    },
    _addNode:function(node){

    },
    _travelTree:function(tree){
        if(tree instanceof Array){
            tree.forEach(function(node, i){
                    travelTree(node);
            });
            return;
        }
        var type = tree.type;
        for( f in tree){
            var v = tree[f], t;
            
            if(f == 'type'){
                if( v == 'Function'){
                    var item = {name: tree.name, line:  tree.line, fullName: tree.longName,
                        start: tree.offset, stop: tree.end
                    };
                    this.result.push(item);
                }else if(v == 'AssignmentExpression'){
                    var right = tree.right;
                    if(tree.operator == '=' && right != null && right.type == 'Function'){
                        this._setFunctionName(tree.left, right);
                    }
                }else if(v == 'PropertyAssignment'){
                    var v = tree.value;
                    if(v!= null && v.type == 'Function'){
                       v.name = tree.name;
                       v.longName = "."+ tree.name;
                    }
                }else if(v == 'VariableDeclaration' && tree.value != null && tree.value.type == 'Function'){
                    tree.value.name = tree.name;
                }
            }else{
                //treePath.push(type+'.'+ f);
                
                t = typeof(v);
                if(t == 'object' && v != null){
                    if(v instanceof Array){
                        for(var i =0, l = v.length; i<l; i++){
                            this._travelTree(v[i]);
                        }
                    }else{
                        this._travelTree(v);
                    }
                }
                //treePath.pop();
             }
        }
    },
    _text:function(offset, end){
        return this.text.substring(offset, end);
    },
    
    _setFunctionName:function(leftTree, funcTree){
        switch(leftTree.type){
        case 'Variable': 
            funcTree.name;
            break;
        case 'PropertyAccess':
            
            funcTree.longName = this._text(leftTree.offset, leftTree.end);
            funcTree.name = leftTree.name.type == 'StringLiteral'? leftTree.name.value : leftTree.name;
            break;
        default:
            funcTree.name = '<'+leftTree.type +'>';
        }
    }
}
exports.JSParser = JSParser;
