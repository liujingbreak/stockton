package stockton.jsEngine;

import org.mozilla.javascript.*;
import java.io.*;
import static java.lang.System.*;
import java.util.logging.*;

public class JavaScriptInvoker{
	private static Logger log = Logger.getLogger(JavaScriptInvoker.class.getName());
	
	private long jsTimestamp = 0;
	private Scriptable scope;
	private Function mainfun;
	private String jsname;
	
	public JavaScriptInvoker(String jsFile){
		jsname = jsFile;
	}
	
	public <T> T calljs(Class<T> retType, Object ... param){
		Context cx = Context.enter();
		try {
			scope = cx.initStandardObjects();
			File f = new File(jsname);
			if(!f.exists()){
				log.warning("Stockton Script File doesn't exist: "+ f.getPath());
				return null;
			}
			long last = f.lastModified();
			if(last > jsTimestamp || mainfun == null){
				if( mainfun != null){
					mainfun.call(cx, scope, null, new Object[]{"refresh"});
				}
				jsTimestamp = last;
				Object r = cx.evaluateReader(scope, new FileReader(f), jsname, 1, null);
				log.info("return js eval : "+r.getClass().getName());
			
				mainfun = (Function)r;
			}
			Object r = mainfun.call(cx, scope, null, param);
			if(retType != null && retType != Void.class)
				return (T)Context.jsToJava(r, retType);
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
		} finally {
			// Exit from the context.
			Context.exit();
		}
		return null;
	}
	
	public static void main(String[] args)throws Exception{
		JavaScriptInvoker v = new JavaScriptInvoker(args[0]);
		v.calljs(Void.class);
		v.calljs(Void.class, "test");
	}
}
