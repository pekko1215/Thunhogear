import java.io.*;

/*
RCTMakerで作成したデータ(for Java)のロード
boolean loadFromFile(String fileName)

停止位置の取得(第1停止用)
int getStopPos1st(int controlNum, int reel, int pos)

停止位置の取得(第2停止用)
int getStopPos2nd(int reel, int pos)

停止位置の取得(第3停止用)
int getStopPos3rd(int reel, int pos)
*/
public class ReelInfo
{
	private int reelLength;
	private byte[][] reelArray;
	private short[] yakuList;
	private byte[][] betLine;
	private byte[][] slideTable;
	
	private byte[] tableNum1;
	private short[][] tableNum23Index;
	private byte[][] tableNum23;
	private short[] tableNum23NumIndex;
	private byte[] tableNum23Num;

	private int tableSize;
	private int tableNumSize;
	private int tableNum23NumSize;
	
	private int controlNum;
	private int stopReel1st;
	private int stopPosIdx1st;
	private int stopPosIdx2nd;
	private int num23Idx;

	public boolean loadFromFile(String fileName)
	{
		boolean ret = true;
		DataInputStream in = null;
		try
		{
			in = new DataInputStream(new FileInputStream(fileName));
			if (in.readInt() != 0x52435432) return false;// "RCT2"
			int controlCount = in.read();
			int reelChipCount = in.read();
			reelLength = in.read();
			int yakuCount = in.read();
			int maxLine = in.read();
			reelArray = new byte[3][reelLength];
			yakuList = new short[yakuCount];
			betLine = new byte[maxLine][4];
			for (int i=0; i<3; i++)
				in.read(reelArray[i]);
			for (int i=0; i<yakuCount; i++)
				yakuList[i] = in.readShort();
			for (int i=0; i<maxLine; i++)
				in.read(betLine[i]);
			
			slideTable = new byte[3][];
			tableSize = (reelLength+1)/2;
			for (int i=0; i<3; i++)
			{
				slideTable[i] = new byte[in.readShort() * tableSize];
			}
			tableNum23Index = new short[3][];
			for (int i=0; i<3; i++)
			{
				tableNum23Index[i] = new short[in.readShort()+1];
			}
			
			tableNumSize = in.read();
			tableNum23NumSize = in.read();
			for (int i=0; i<3; i++)
				in.read(slideTable[i]);
			
			tableNum1 = new byte[controlCount * 3 * tableNumSize];
			in.read(tableNum1);
			
			for (int i=0; i<3; i++)
			{
				for (int j=1; j<tableNum23Index[i].length; j++)
				{
					tableNum23Index[i][j] = in.readShort();
				}
			}
			
			tableNum23 = new byte[3][];
			for (int i=0; i<3; i++)
			{
				tableNum23[i] = new byte[tableNum23Index[i][tableNum23Index[i].length-1]*tableNumSize];
				in.read(tableNum23[i]);
			}
			tableNum23NumIndex = new short[controlCount*6+1];
			for (int i=1; i < controlCount*6+1; i++)
				tableNum23NumIndex[i] = in.readShort();
			tableNum23Num = new byte[tableNum23NumIndex[controlCount*6]*tableNum23NumSize];
			in.read(tableNum23Num);
		}
		catch (IOException e)
		{
			ret = false;
		}
		finally
		{
			if (in != null)
			{
				try
				{
					in.close();
				}
				catch (IOException e)
				{
					ret = false;
				}
			}
		}
		return ret;
	}
	private int getStopPos(int reel, int num, int pos)
	{
		int slide = slideTable[reel][num * tableSize + pos / 2];
		if ((pos & 1) == 0) slide = slide >> 4;
		else slide = slide &0x0F;
		int ret = pos - slide;
		if (ret < 0) ret += reelLength;
		return ret;
	}

	private int getStopPosIndex(int reel, int num, int pos)
	{
		int flags = 0;
		int ret = 0;
		for (int i=0; i< reelLength; i++)
		{
			int p = getStopPos(reel, num, i);
			flags = flags | (1 << p);
		}
		if ((flags & (1 << pos)) == 0) return -1;
		for (int i=0; i< pos; i++)
		{
			if ((flags & (1 << i)) != 0) ret++;
		}
		
		return ret;
	}
	private int readData(byte[] b, int idx, boolean isShort)
	{
		if (isShort)
		{
			return ((b[idx*2] & 0xFF) << 8) | (b[idx*2+1] & 0xFF);
		}
		return b[idx] & 0xFF;
	}
	public int getStopPos1st(int controlNum, int reel, int pos)
	{
		int num = readData(tableNum1, controlNum * 3 + reel, tableNumSize == 2);
		int ret = getStopPos(reel, num, pos);
		this.controlNum = controlNum;
		stopReel1st = reel;
		stopPosIdx1st = getStopPosIndex(reel, num, ret);
		return ret;
	}
	
	public int getStopPos2nd(int reel, int pos)
	{
		int stopPattern;
		switch(stopReel1st)
		{
			case 0:
				stopPattern = reel - 1;
				break;
			case 1:
				stopPattern = reel == 0 ? 2 : 3;
				break;
			default:
				stopPattern = reel == 0 ? 4 : 5;
		}
		int idx = controlNum * 6 + stopPattern;
		int idx2 = tableNum23NumIndex[idx];
		if (tableNum23NumIndex[idx+1]-idx2 == 1) stopPosIdx1st = 0;
		int num23num = readData(tableNum23Num, idx2 + stopPosIdx1st, tableNum23NumSize == 2);
		num23Idx = tableNum23Index[stopReel1st][num23num];
		int num = readData(tableNum23[stopReel1st], num23Idx, tableNumSize == 2);
		int ret = getStopPos(reel, num, pos);
		stopPosIdx2nd = getStopPosIndex(reel, num, ret);
		if (tableNum23Index[stopReel1st][num23num+1]-num23Idx == 2) stopPosIdx2nd = 0;
		return ret;
	}
	
	public int getStopPos3rd(int reel, int pos)
	{
		int num = readData(tableNum23[stopReel1st], num23Idx + stopPosIdx2nd + 1, tableNumSize == 2);
		int ret = getStopPos(reel, num, pos);
		return ret;
	}
}
