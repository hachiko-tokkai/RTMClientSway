package rtmsway;

/** RTMBodyMotion由来のカント不足入力・複合曲線イベント。単位はm/s・m/s²・度。 */
final class Curve {
    private static final double GRAVITY=9.80665, GAUGE=1067;
    private static final double ROLL_KICK=Motion.peak(.40,.75,.10);
    private static final double SWAY_KICK=Motion.peak(.012,.85,.10);
    double filtered, rollImpulse, swayImpulse;
    private boolean isActive;
    private int candidate, stableTicks, direction, stageSign, stageTicks, exitTicks;
    private double reference, injectedRoll, injectedSway;

    void reset() {
        filtered=rollImpulse=swayImpulse=0;
        candidate=stableTicks=0;
        resetEvent();
    }
    double update(double seconds,double speed,double lat,double cant) {
        rollImpulse=swayImpulse=0;
        int ticks=(int)Math.round(seconds*20);
        double deficit=deficit(speed,lat,cant);
        int sign=Math.abs(deficit)>.0001?(int)Math.signum(deficit):0;
        if(sign==0){candidate=stableTicks=0;}
        else if(candidate==sign){stableTicks+=ticks;}
        else{candidate=sign;stableTicks=ticks;}
        if(stableTicks<2)deficit=0;
        filtered+=(deficit-filtered)*Math.min(1,seconds*2*Math.PI*1.6);
        event(filtered,ticks);
        return Math.signum(filtered)*response(filtered);
    }
    static double deficit(double speed,double lat,double cant) {
        double curvature=speed>.20?Math.abs(lat/(speed*speed)):0;
        double radius=curvature>.000001?1/curvature:1e9;
        double kmh=speed*3.6;
        double equilibrium=GAUGE*kmh*kmh/(127*radius);
        double actual=GAUGE*Math.tan(Math.toRadians(Math.abs(cant)));
        double missing=Math.max(0,equilibrium-actual);
        double input=speed>=4&&missing>=5?Math.signum(lat)*GRAVITY*missing/GAUGE:0;
        return Motion.limit(input,3);
    }
    static double response(double magnitude) {
        return Math.tanh(Math.abs(magnitude)*GAUGE/GRAVITY/50);
    }
    private void stage(double from,double to) {
        double delta=response(to)-response(from);
        double roll=Motion.limit(delta*ROLL_KICK,Math.max(0,2*ROLL_KICK-injectedRoll));
        double sway=Motion.limit(delta*SWAY_KICK,Math.max(0,2*SWAY_KICK-injectedSway));
        rollImpulse+=direction*roll;
        swayImpulse-=direction*sway;
        injectedRoll+=Math.abs(roll);injectedSway+=Math.abs(sway);
    }
    private void event(double input,int ticks) {
        int sign=Math.abs(input)>.0001?(int)Math.signum(input):0;
        double magnitude=Math.abs(input);
        if(!isActive){
            if(sign==0||magnitude<.008)return;
            isActive=true;direction=sign;reference=magnitude;
            injectedRoll=injectedSway=0;stageSign=stageTicks=exitTicks=0;
            stage(0,magnitude);
        }
        if(sign==direction&&magnitude>=.004){
            exitTicks=0;
            double delta=magnitude-reference;
            if(Math.abs(delta)>=.018){
                int next=(int)Math.signum(delta);
                if(stageSign==next)stageTicks+=ticks;
                else{stageSign=next;stageTicks=ticks;}
                if(stageTicks>=2){stage(reference,magnitude);reference=magnitude;stageSign=stageTicks=0;}
            }else{stageSign=stageTicks=0;}
            return;
        }
        if(sign==-direction&&magnitude>=.008){exit(0);event(input,ticks);return;}
        exitTicks+=ticks;
        if(exitTicks>=6)exit(.62);
    }
    private void exit(double factor) {
        double ratio=response(reference)*factor;
        rollImpulse-=direction*ratio*ROLL_KICK;
        swayImpulse+=direction*ratio*SWAY_KICK;
        resetEvent();
    }
    private void resetEvent() {
        isActive=false;direction=0;reference=injectedRoll=injectedSway=0;
        stageSign=stageTicks=exitTicks=0;
    }
}
