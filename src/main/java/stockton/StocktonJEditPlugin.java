package stockton;

import org.gjt.sp.jedit.*;
import org.gjt.sp.jedit.msg.*;
import stockton.jsEngine.*;
import static java.lang.System.*;
import java.util.logging.*;
import static stockton.jsEngine.JsInvokerFactory.*;

public class StocktonJEditPlugin extends EditPlugin implements EBComponent{
	public static Logger log = Logger.getLogger(StocktonJEditPlugin.class.getName());
	
	public StocktonJEditPlugin(){
		
	}
	
	public void start()
	{
		mainJs().calljs(Void.class, "start", this);
	}
	
	public void stop(){
		mainJs().calljs(Void.class, "stop");
	}
	
	public void handleMessage(EBMessage message)
	{
		mainJs().calljs(Void.class, "msg", message);
	}
	
	public static void action(String name){
		mainJs().calljs(Void.class, name);
	}
}
