package rtmsway;

/** 距離入力・カーブ・制動を共通サスペンションへ渡す描画用モデル。 */
final class Motion {
    final Spring roll = new Spring(.75, .10, 3), sway = new Spring(.85, .10, .085);
    final Spring bounce = new Spring(2.1, .62, .012), branchY = new Spring(2.1, .1297, .012);
    final Spring pitch = new Spring(.72, .14, .65), shift = new Spring(.78, .28, .04);
    private static final double[] NOTCH = {0,0,0,0,0,.50,.75,1.05,1.45};
    private static final double[] ROLL_IMPULSE = {peak(.20,.75,.10),peak(.60,.75,.10)};
    private static final double[] SWAY_IMPULSE = {peak(.005,.85,.10),peak(.015,.85,.10)};
    private final double phase;
    final Curve curve = new Curve();
    private double accel, decel, peakDecel;
    private int cool;
    private boolean isMoving;
    double dt = .05;
    Motion(int id, double speed) { phase = id * 1.61803398875; isMoving = speed > .25; }
    void save() { roll.save(); sway.save(); bounce.save(); branchY.save(); pitch.save(); shift.save(); }
    void reset(double speed) {
        curve.reset();
        accel = decel = peakDecel = 0;
        isMoving = speed > .25; cool = 0;
        for (Spring s : new Spring[]{roll,sway,bounce,branchY,pitch,shift}) { s.v = 0; s.save(); }
    }
    void update(double seconds, double distance, double speed, double prevSpeed,
                double lat, double cant, int dir, int brake, boolean isBad) {
        dt = seconds;
        double curveInput=curve.update(seconds,speed,lat,cant);
        roll.v+=curve.rollImpulse*SwayMod.curve;
        sway.v+=curve.swayImpulse*SwayMod.curve;
        double rawAccel = isBad ? 0 : limit((speed - prevSpeed) / seconds, 3.5);
        accel += (rawAccel - accel) * (1 - Math.exp(-seconds * 5));
        double next = Math.max(0, -accel), jerk = (next - decel) / seconds;
        cool = Math.max(0, cool - (int)Math.round(seconds * 20));
        if (!isBad && brake > 0 && next > 1.15 && jerk > 2 && cool == 0) {
            pitch.v += dir * .0376 * SwayMod.stop;
            shift.v += dir * .020 * SwayMod.stop; cool = 20;
        }
        if (!isMoving && speed > .25) { isMoving = true; peakDecel = 0; }
        if (isMoving) peakDecel = Math.max(peakDecel * Math.exp(-seconds * .25), next);
        if (isMoving && speed < .06) {
            if (!isBad && brake >= 5 && peakDecel >= .75) {
                double force = NOTCH[Math.min(8,brake)] * Math.min(1.15, .85 + peakDecel * .15) * SwayMod.stop;
                pitch.v += dir * .098 * force; shift.v += dir * .026 * force;
            }
            isMoving = false; peakDecel = 0;
        }
        decel = next;
        double weight = (1 - Math.exp(-Math.max(0,speed * 3.6 - 3) / 50)) * SwayMod.run;
        double envelope = .65 + .35 * Math.sin(distance * .021 + phase);
        double track = weight * envelope;
        roll.step(curveInput * 1.2 * SwayMod.curve + wave(distance,phase) * .20 * track, seconds);
        sway.step(-curveInput * .030 * SwayMod.curve + wave(distance,phase+8.7) * .006 * track, seconds);
        bounce.step(wave(distance,phase+19.3) * .002 * track, seconds);
        branchY.step(0,seconds); pitch.step(0,seconds); shift.step(0,seconds);
    }
    void impact(boolean isFrog, int dir, double speed) {
        int kind = isFrog ? 1 : 0;
        double ratio = speed * 3.6 / 60;
        double gain = (.45 + .55 / (1 + ratio * ratio)) * SwayMod.branch;
        roll.v += dir * ROLL_IMPULSE[kind] * gain;
        sway.v -= dir * SWAY_IMPULSE[kind] * gain;
        branchY.v += (isFrog ? .128 : .038) * gain;
    }
    private static double wave(double distance,double phase) {
        double p = (distance + phase) * Math.PI * 2;
        return Math.sin(p/5.3)*.34 + Math.sin(p/9.7)*.28 + Math.sin(p/17.9)*.23 + Math.sin(p/37.1)*.15;
    }
    static double peak(double value,double hz,double damping) {
        double root = Math.sqrt(1-damping*damping);
        return value * Math.PI * 2 * hz / Math.exp(-damping/root * Math.atan(root/damping));
    }
    static double limit(double value,double max) { return Math.max(-max,Math.min(max,value)); }
    static double soft(double value,double max) {
        double knee = max * .72, size = Math.abs(value);
        return size <= knee ? value : Math.signum(value) * (knee + (max-knee)*(1-Math.exp(-(size-knee)/(max-knee))));
    }
    /** 一定目標に対する減衰振動の解析解。更新間隔にかかわらず同じ周波数で進む。 */
    static final class Spring {
        double x, v, prev, prevV;
        final double hz, damping, max, w, decay, damped;
        Spring(double hz,double damping,double max) {
            this.hz=hz;this.damping=damping;this.max=max;
            w=2*Math.PI*hz;decay=damping*w;damped=w*Math.sqrt(1-damping*damping);
        }
        void save(){prev=x;prevV=v;}
        void step(double target,double seconds) {
            double offset=x-target, c=Math.cos(damped*seconds), s=Math.sin(damped*seconds), e=Math.exp(-decay*seconds);
            double next=e*(offset*c+(v+decay*offset)/damped*s);
            v=e*(v*c-(decay*v+w*w*offset)/damped*s);x=target+next;
            if(Math.abs(x)>max){x=limit(x,max);if(x*v>0)v=0;}
        }
        double raw(double f,double seconds) {
            double t2=f*f,t3=t2*f;
            return (2*t3-3*t2+1)*prev+(t3-2*t2+f)*prevV*seconds+(-2*t3+3*t2)*x+(t3-t2)*v*seconds;
        }
        double pose(double f,double seconds){return soft(raw(f,seconds),max);}
    }
}
