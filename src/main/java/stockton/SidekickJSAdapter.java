package stockton;

import java.util.*;
import java.util.regex.*;
import java.util.logging.*;
import java.io.*;
import java.util.regex.*;
import javax.swing.tree.*;
import errorlist.*;
import sidekick.*;
import stockton.jsEngine.*;

public class SidekickJSAdapter extends SideKickParser{
	private Logger log = Logger.getLogger(SidekickJSAdapter.class.getName());
	String name;
	JavaScriptInvoker jscaller;
	
	public SidekickJSAdapter(String name){
		super(name);
		this.name = name;
		jscaller = JsInvokerFactory.mainJs();
	}
	
	
	public SideKickParsedData parse(org.gjt.sp.jedit.Buffer buffer, DefaultErrorSource errorSource)
	{
		try{
			return jscaller.calljs(SideKickParsedData.class,
				"p", buffer.getName(), buffer.getText(0,buffer.getLength()));
			
		}catch(Exception e){
			log.log(Level.WARNING,"parse failed",e);
		}
		return null;
	}
}
