package stockton.jsEngine;

import org.mozilla.javascript.*;
import java.io.*;
import static java.lang.System.*;
import java.util.logging.*;
import java.util.*;

public class JavaScriptInvoker{
	private static Logger log = Logger.getLogger(JavaScriptInvoker.class.getName());
	
	private long jsTimestamp = 0;
	private Scriptable scope;
	private Function mainfun;
	private String jsname;
	private File tempFolder = new File(System.getProperty("user.home"), ".stockton");
	private Script initScope;
	private Map<String, Scriptable> jsExports = new HashMap();
	
	public JavaScriptInvoker(String jsFile){
		jsname = jsFile;
	}
	
	protected void deployJsRes(String re, File target){
		InputStream in = null;
		FileOutputStream out = null;
		try{
			in = JavaScriptInvoker.class.getResourceAsStream(re);
			out = new FileOutputStream(target);
		
			byte[] buf = new byte[ 1024 ];
			int c = in.read(buf);
			while( c >=0 ){
				out.write(buf, 0, c);
				c = in.read(buf);
			}
		}catch(Exception ex){
			log.log(Level.WARNING, "deploy failed: "+ target.getPath(), ex);
		}finally{
			try{
			out.close();
			in.close();
			}catch(Exception e){
			}
		}
	}
	
	public File loadJs(String jsFile){
			if(! tempFolder.exists())
					tempFolder.mkdirs();
			File f = new File(tempFolder, jsFile);
			if(! f.exists()){
				log.info("Stockton Script File doesn't exist: "+ f.getPath() +", copying the file.");
				deployJsRes("/js/"+ jsFile, f);
			}
			return f;
	}
	
	public Object requireJs(String jsFile){
			Scriptable exp = jsExports.get(jsFile);
			if(exp != null)
					return exp;
			Context cx = Context.enter();
			try{
					cx.setOptimizationLevel(1);
					File f = loadJs(jsFile);
					Scriptable sp = cx.initStandardObjects();
					setupInitScope(cx, sp);
					cx.evaluateReader(sp, new FileReader(f), jsFile, 1, null);
					Scriptable module = (Scriptable) ScriptableObject.getProperty(sp, "module");
					exp = (Scriptable) module.get("exports", module);
					jsExports.put(jsFile, exp);
					return exp;
			}catch(Exception ex){
					log.log(Level.SEVERE, "", ex);
					return null;
			}finally {
				Context.exit();
			}
	}
	
	public void clearJsExports(){
			jsExports.clear();
			log.fine("clear Js Exports");
	}
	
	protected void setupInitScope(Context cx, Scriptable sp)throws 
	java.io.UnsupportedEncodingException,
	java.io.IOException
	{
			if(initScope == null){
					initScope = cx.compileReader(new InputStreamReader(
							JavaScriptInvoker.class.getResourceAsStream("/js/initscope.js"), "utf-8"),
							"/js/initscope.js", 1, null);
			}
			initScope.exec(cx, sp);
			Object wrappedOut = cx.javaToJS(this, sp);
			ScriptableObject.putProperty(sp, "__invoker", wrappedOut);
	}
	
	public void greets(){
			log.info("Greeting from JavaScriptInvoker");
	}
	
	public <T> T calljs(Class<T> retType, Object ... param){
		Context cx = Context.enter();
		try {
			
			if(! tempFolder.exists())
					tempFolder.mkdirs();
			File f = loadJs(jsname);
			long last = f.lastModified();
			if(last > jsTimestamp || mainfun == null){
				// clean up
				if( mainfun != null){
					mainfun.call(cx, scope, null, new Object[]{"refresh"});
				}
				jsTimestamp = last;
				// new scope
				scope = cx.initStandardObjects();
				
				setupInitScope(cx, scope);
			
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
