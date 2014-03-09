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
	public static Icon ICON1;
	public static Icon ICON2;
	public static Icon ICON3;

	public int type = 0;

	static{
		ICON = new ImageIcon(SidekickNode.class.getResource("/methpub_obj.png"));
		ICON1 = new ImageIcon(SidekickNode.class.getResource("/red_square_dot.jpg"));
		ICON2 = new ImageIcon(SidekickNode.class.getResource("/yellow_square_dot.jpg"));
		ICON3 = new ImageIcon(SidekickNode.class.getResource("/blue_square_dot.gif"));
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
		switch(type){
		case 1:
			return ICON1;
		case 2:
			return ICON2;
		case 3:
			return ICON3;
		default:
			return ICON;
		}
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
