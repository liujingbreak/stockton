package stockton.sidekickParser;

import org.liujing.ironsword.grammar.*;
import sidekick.*;
import javax.swing.tree.*;

public class SidekickTreeConverter{

	public static void sidekick(String name, GrammarNode node){
		convert(node, createSidekickData(name).root);
	}
	
	protected static SideKickParsedData createSidekickData(String name){
		SideKickParsedData sidekick = new SideKickParsedData(name);
		return sidekick;
	}
	
	protected static void convert(GrammarNode gnode, DefaultMutableTreeNode uiNode){
		for(GrammarNode cg : gnode.getChildren()){
			DefaultMutableTreeNode subUi = new DefaultMutableTreeNode();
			subUi.setUserObject(sidekickEl_type(gnode));
			uiNode.add(subUi);
			convert(cg, subUi);
		}
	}
	
	private static SidekickNode sidekickEl_type(GrammarNode node){
		SidekickNode el = new SidekickNode(node.getName(), "");
		el.setStartOffset(node.getStartOffset());
		el.setEndOffset(node.getEndOffset());
		return el;
	}
	
	
}
