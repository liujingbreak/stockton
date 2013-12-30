package stockton.jsEngine;

import org.mozilla.javascript.*;
import java.io.*;
import static java.lang.System.*;
import java.util.logging.*;

public class JsInvokerFactory{
	
	public static JavaScriptInvoker mainJs(){
		return InvokerHolder.INSTANCE;
	}
	
	static class InvokerHolder{
		static JavaScriptInvoker INSTANCE = new JavaScriptInvoker(
			"jedit-stockton.js");
	}
}
