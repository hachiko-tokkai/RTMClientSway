package rtmsway;

import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Random;
import javax.script.*;

/** 固定参照JSのカント入力・曲線イベントとJava実装を同じ時系列で比較する。 */
public final class VerifyCurve {
    private static void check(boolean ok,String why){if(!ok)throw new AssertionError(why);}
    private static void near(double a,double b,String why){check(Math.abs(a-b)<1e-10,why+": "+a+" / "+b);}
    public static void main(String[] args)throws Exception{
        byte[] bytes=Files.readAllBytes(Paths.get(args[0]));
        StringBuilder hash=new StringBuilder();
        for(byte b:MessageDigest.getInstance("SHA-256").digest(bytes))hash.append(String.format("%02X",b&255));
        check(hash.toString().equals("6EB4A61315E2B899CE9AE6BB16F1A3CC7A431EFD6B4697DA675406B60B264A5E"),"fixed reference hash");
        ScriptEngine engine=new ScriptEngineManager().getEngineByName("nashorn");
        check(engine!=null,"Java 8 Nashorn is required for reference verification");
        engine.eval(new String(bytes,StandardCharsets.UTF_8));
        engine.eval("motionBuildConfig(); var refState; function resetRef(){refState={filteredLateral:0,curveCandidateSign:0,curveStableTicks:0,rollVelocity:0,swayVelocity:0};motionResetCurveEvent(refState);} resetRef();");
        String source=new String(bytes,StandardCharsets.UTF_8);
        int start=source.indexOf("var curvature = absSpeed > 0.20");
        int end=source.indexOf("var rawAcceleration =",start);
        check(start>=0&&end>start,"original curve input block");
        engine.eval("function refUpdate(dt,absSpeed,lateralAcceleration,cantDegrees){var state=refState,tickDelta=Math.round(dt*20);var signedSpeed=absSpeed;var yawRate=absSpeed>0?lateralAcceleration/absSpeed:0;"+
            source.substring(start,end)+"state.rollVelocity=state.swayVelocity=0;motionUpdateCurveEvent(state,state.filteredLateral,tickDelta);return [state.filteredLateral,motionSign(state.filteredLateral)*motionCurveResponseRatio(state.filteredLateral),state.rollVelocity,state.swayVelocity];}");
        Invocable js=(Invocable)engine;
        Curve curve=new Curve();Random random=new Random(8217);int samples=0;
        for(int i=0;i<6000;i++){
            if(i%500==0){curve.reset();js.invokeFunction("resetRef");}
            double speed,lat,cant,dt=.05;
            int phase=i%500;
            if(phase<80){speed=20;lat=.5;cant=0;}
            else if(phase<160){speed=20;lat=.5;cant=5;}
            else if(phase<240){speed=20;lat=-.8;cant=-2;}
            else if(phase<320){speed=0;lat=0;cant=5;}
            else{speed=random.nextDouble()*60;lat=(random.nextDouble()-.5)*4;cant=(random.nextDouble()-.5)*12;dt=(1+random.nextInt(5))*.05;}
            double ratio=curve.update(dt,speed,lat,cant);
            Object result=js.invokeFunction("refUpdate",dt,speed,lat,cant);
            engine.put("result",result);
            near(curve.filtered,((Number)engine.eval("result[0]")).doubleValue(),"filtered deficit");
            near(ratio,((Number)engine.eval("result[1]")).doubleValue(),"lean ratio");
            near(curve.rollImpulse,((Number)engine.eval("result[2]")).doubleValue(),"roll event");
            near(curve.swayImpulse,((Number)engine.eval("result[3]")).doubleValue(),"sway event");
            samples++;
        }
        check(Curve.deficit(20,.5,5)==0,"sufficient cant adds no lean");
        check(Curve.deficit(0,0,5)==0,"stopped cant adds no lean");
        check(Curve.deficit(3,.5,0)==0,"reference low speed threshold");
        near(Curve.deficit(20,.5,2),-Curve.deficit(20,-.5,-2),"curve mirror");
        SwayMod.run=0;SwayMod.curve=1;SwayMod.branch=0;SwayMod.stop=0;
        Motion moving=new Motion(8,20);
        for(int i=0;i<400;i++){moving.save();moving.update(.05,i,20,20,.8,2,1,0,false);}
        check(moving.roll.x>.1&&moving.sway.x<0,"additional outward lean with insufficient cant");
        for(int i=0;i<800;i++){moving.save();moving.update(.05,400,0,0,0,2,1,0,false);}
        check(Math.abs(moving.roll.x)<1e-7&&Math.abs(moving.sway.x)<1e-7,"added lean settles on canted track");
        System.out.println("PASS: "+samples+" reference curve samples, filtered input, events, cant compensation and stop settling");
    }
}
