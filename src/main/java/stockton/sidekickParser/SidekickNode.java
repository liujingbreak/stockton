package stockton.sidekickParser;

import java.util.*;
import java.util.logging.*;
import java.io.*;
import sidekick.*;
import javax.swing.*;
import javax.swing.text.Position;
import sidekick.util.*;

public class SidekickNode extends Asset implements SideKickElement{
	private String desc;
	public static Icon ICON;

	public int type = 0;
	public static int TYPE_FUNCTION = 0;
	public static int TYPE_JSON = 1;
	public static int TYPE_BLOCK = 2;

	static{
		ICON = new ImageIcon(SidekickNode.class.getResource("/methpub_obj.png"));
	}

	public SidekickNode(String name,String desc){
		super(name);
		this.desc = desc;
	}

	public SidekickNode(String name,String desc, int type){
		super(name);
		this.desc = desc;
		this.type = type;
	}

	public Icon getIcon(){
		return ICON;
	}

	public String getShortString(){
		return name;
	}

	public String getLongString(){
		return desc;
	}

	public void setStartOffset(int offset){
		setStart(new TextPos(offset));
	}
	public void setEndOffset(int offset){
		setEnd(new TextPos(offset));
	}

	public void setStartLocation( Location loc ) {
        //startLocation = loc;
    }

    public Location getStartLocation() {
        return null;
    }

    public void setEndLocation( Location loc ) {
        //endLocation = loc;
    }

    public Location getEndLocation() {
        return null;
    }

	public Position getStartPosition() {
        return getStart();
    }

    public void setStartPosition(Position p) {
        super.setStart(p);
    }


    public void setEndPosition(Position p) {
        setEnd(p);
    }

    public Position getEndPosition() {
        return super.getEnd();
    }

	public String toString(){
		return getName();
	}

	public static class TextPos implements Position{
		int offset = -1;
		public TextPos(int p){
			offset = p;
		}
		public int getOffset(){
			return offset;
		}
	}
}
