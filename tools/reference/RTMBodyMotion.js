//=============================================================================
// RTM 車輛搖晃 JS 模組 v1.0 / RTM車両動揺JSモジュール v1.0 / RTM VEHICLE BODY-MOTION JS MODULE v1.0
//=============================================================================
// 製作：C-TREC & 月島重工 / 制作：C-TREC & 月島重工 / Made by C-TREC & 月島重工
// 授權：可自由使用、修改與再發布；使用時須在列車的 readme 中標明「使用了 C-TREC & 月島重工 製作的晃動 JS」。詳見 ライセンス_License.txt。 /
// ライセンス：自由に使用・改変・再配布できます。使用する場合は車両のreadmeに「C-TREC & 月島重工 制作の動揺JSを使用」と明記してください。詳細は ライセンス_License.txt。 /
// License: free to use, modify and redistribute; when used, the vehicle's readme must state that it uses the body-motion JS made by C-TREC & 月島重工. See ライセンス_License.txt.
// 本檔案不含任何車種專用名稱，可複製到其他列車包直接使用。安裝方式見列車包內的「導入説明_InstallationGuide.txt」。 /
// 本ファイルは車種固有の名前を含まず、他の車両パックへコピーしてそのまま使えます。導入方法はパック内の「導入説明_InstallationGuide.txt」を参照してください。 /
// This file contains no train-specific names and can be copied into other vehicle packs as is. See "導入説明_InstallationGuide.txt" in the pack for installation.
// 內容：彎道晃動與車體懸吊、直線晃動、道岔衝擊、制動與停車衝動、乘客載重懸吊、幀間插值與描畫輸出。 /
// 内容：曲線動揺と車体サスペンション、直線動揺、分岐器衝撃、制動・停止衝動、乗客荷重サスペンション、フレーム補間と描画出力。 /
// Contents: curve motion and body suspension, straight-track motion, turnout impacts, braking and stop shock, passenger-load suspension, frame interpolation and render output.
// 支援 1.7.10（KaizPatchX）、1.12.2（RTM 2.4.x）、RTMU 1.21.1（NeoForge／Fabric）；版本差異由下方自動載入的 RTMBodyMotionAdapter.js 處理。 /
// 1.7.10（KaizPatchX）・1.12.2（RTM 2.4.x）・RTMU 1.21.1（NeoForge／Fabric）対応。版差は下で自動的に読み込むRTMBodyMotionAdapter.jsが吸収します。 /
// Supports 1.7.10 (KaizPatchX), 1.12.2 (RTM 2.4.x) and RTMU 1.21.1 (NeoForge/Fabric); RTMBodyMotionAdapter.js, loaded automatically below, absorbs the version differences.
// 注意：RTM 會把「雙斜線＋include＋空格＋角括號」這段文字（連註解裡的也算）當成載入指令展開，因此註解中不要寫出這段文字。 /
// 注意：RTMは「スラッシュ2つ＋include＋空白＋山括弧」という文字列を（コメント内でも）読込指示として展開するため、コメントにこの文字列を書かないでください。 /
// Note: RTM expands the text "two slashes + include + space + angle bracket" as a load directive even inside comments, so never write that text in a comment.

// 模組自行匯入需要的 Java 套件，車輛腳本不必為了本模組另外 importPackage；名稱已存在（車輛腳本已匯入）時略過，不影響既有腳本。
// 必須在載入平台適配器之前執行，因為適配器載入時就會用 NGTUtil 與 RTMCore 判斷版本。 /
// モジュールが必要なJavaパッケージを自前で読み込むため、車両スクリプトは本モジュールのために別途importPackageする必要はありません。名前が既にある（車両スクリプトで読込済み）場合は省略し、既存スクリプトに影響しません。
// アダプターは読込時にNGTUtilとRTMCoreでバージョン判定するため、アダプターの読込より前に実行する必要があります。 /
// The module imports the Java packages it needs, so vehicle scripts need no extra importPackage for it; names that already exist (imported by the vehicle script) are skipped, leaving existing scripts unaffected.
// This must run before loading the platform adapter, which uses NGTUtil and RTMCore to detect the platform as soon as it loads.
if (typeof GL11 === "undefined") { try { importPackage(Packages.org.lwjgl.opengl); } catch (e) {} }
if (typeof NGTUtil === "undefined" || typeof MCWrapper === "undefined") { try { importPackage(Packages.jp.ngt.ngtlib.util); } catch (e) {} }
if (typeof NGTLog === "undefined") { try { importPackage(Packages.jp.ngt.ngtlib.io); } catch (e) {} }
if (typeof RTMCore === "undefined") { try { importPackage(Packages.jp.ngt.rtm); } catch (e) {} }
if (typeof TileEntityLargeRailBase === "undefined" || typeof TileEntityLargeRailSwitchCore === "undefined") { try { importPackage(Packages.jp.ngt.rtm.rail); } catch (e) {} }

//include <scripts/RTMBodyMotionAdapter.js>

//=============================================================================
// 預設調校值 / 既定の調整値 / DEFAULT TUNING
//=============================================================================
// 車輛腳本可定義 MOTION_TUNING，只寫要改的項目即可；未寫的項目使用以下預設值。 /
// 車両スクリプトはMOTION_TUNINGを定義でき、変更する項目だけ書けば十分です。書かない項目は以下の既定値を使います。 /
// A vehicle script may define MOTION_TUNING with only the entries it changes; anything omitted uses the defaults below.
var MOTION_DEFAULT_TUNING = {
	//----------------------------------------------------------------------
	// 彎道晃動與車體懸吊 / 曲線動揺と車体サスペンション / CURVE MOTION AND BODY SUSPENSION
	// 車體固有頻率與阻尼（彎道、道岔、直線晃動共用），以及超高不足造成的持續外傾與進出彎衝擊。 / 車体固有周波数と減衰（曲線・分岐器・直線で共用）、カント不足による持続外傾と進入退出の衝撃。 / Body natural frequency and damping (shared by curve, turnout and straight motion), plus sustained lean and entry/exit jolts from cant deficiency.
	//----------------------------------------------------------------------
	curve: {
		amplitudeScale: 1.00,      // 彎道整體幅度倍率；峰值已直接由 peakRollDeg／peakSwayM 指定 / 曲線全体振幅倍率；ピーク値はpeakRollDeg／peakSwayMで直接指定 / Overall curve-amplitude scale; peaks are set directly by peakRollDeg/peakSwayM.
		sluggishnessScale: 1.00,   // 車體反應與拖尾時間倍率；只改變時間，不改變幅度 / 車体応答と余韻の時間倍率；時間のみ変え振幅は不変 / Body response and tail-time scale; changes timing only, not amplitude.
		maxRollDeg: 3.00,          // 所有通道合成後的最大左右傾角 / 全チャンネル合成後の最大ロール角 / Maximum combined roll angle.
		maxSwayM: 0.085,           // 所有通道合成後的最大橫向位移 / 全チャンネル合成後の最大横変位 / Maximum combined lateral offset.
		leanRollDeg: 1.20,         // 彎道中持續的外傾角（超高不足飽和時）；進彎過衝、出彎反彈由彈簧自然產生；0=舊版不持續側傾 / 曲線中の持続外傾角（カント不足飽和時）；進入時の行き過ぎと退出時の戻りはばねが自然に生成；0=旧版の持続傾斜なし / Sustained outward lean in curves at saturated cant deficiency; entry overshoot and exit rebound come from the spring; 0 restores the old no-lean behavior.
		leanSwayM: 0.030,          // 彎道中持續的外側橫移（超高不足飽和時） / 曲線中の持続外側横変位（カント不足飽和時） / Sustained outward sway in curves at saturated cant deficiency.
		peakRollDeg: 0.40,         // 進彎時額外的衝擊峰值（疊加在持續外傾上） / 曲線進入時の追加衝撃ピーク（持続外傾に重畳） / Extra curve-entry jolt peak, added on top of the sustained lean.
		peakSwayM: 0.012,          // 進彎時額外的橫移衝擊峰值 / 曲線進入時の追加横変位衝撃ピーク / Extra curve-entry sway jolt peak.
		saturationMm: 50.0,        // 超高不足飽和基準；約此值時達峰值的76% / カント不足飽和基準；この値でピークの約76% / Cant-deficiency saturation reference; reaches about 76% of peak here.
		rollFrequencyHz: 0.75,     // 車體橫搖固有頻率；越小越柔 / 車体ロール固有周波数；小さいほど柔らかい / Body roll natural frequency; lower is softer.
		rollDamping: 0.10,         // 車體橫搖阻尼比；越小回彈次數越多、餘韻越長 / 車体ロール減衰比；小さいほど揺り返しが多く余韻が長い / Body roll damping ratio; lower gives more rebounds and a longer tail.
		swayFrequencyHz: 0.85,     // 車體橫移固有頻率 / 車体横変位固有周波数 / Body lateral-sway natural frequency.
		swayDamping: 0.10,         // 車體橫移阻尼比 / 車体横変位減衰比 / Body lateral-sway damping ratio.
		inputFilterHz: 1.6,        // 超高不足輸入濾波；越大反應越快但越易受 Yaw 雜訊影響 / カント不足入力フィルタ；大きいほど速いがYawノイズに敏感 / Cant-deficiency input filter; higher is quicker but more sensitive to yaw noise.
		minSpeedMps: 4.0,          // 開始判定超高不足的最低速度 / カント不足判定の最低速度 / Minimum speed for cant-deficiency motion.
		minCantDeficiencyMm: 5.0,  // 啟動晃動的最低超高不足 / 動揺開始の最小カント不足 / Minimum cant deficiency that can trigger motion.
		exitResponseFactor: 0.62,  // 出彎反向回應倍率 / 曲線退出時の逆応答倍率 / Reverse response multiplier on curve exit.
		reverseExitFactor: 0.00,   // 反向彎（S 形）時前彎的額外出彎衝量倍率；持續外傾翻轉已提供反向甩動，預設不再疊加 / 反向曲線（S字）時の前曲線追加退出衝撃倍率；持続外傾の反転で逆振りが出るため既定では重ねない / Extra exit-impulse multiplier on an S-curve reversal; the lean flip already swings the body, so none is added by default.
		stageThreshold: 0.018,     // 不同曲率階段成立門檻 / 曲率段階差の成立しきい値 / Sustained curvature-stage threshold.
		stageHoldTicks: 2,         // 曲率差需持續的 Tick / 曲率差の必要継続Tick / Ticks a curvature change must persist.
		exitHoldTicks: 6           // 確認離開整體彎道的 Tick；反向彎（S 形）不必等待 / 曲線退出確認Tick；反向曲線（S字）は待たない / Ticks required to confirm curve exit; reverse (S) curves do not wait.
	},
	//----------------------------------------------------------------------
	// 直線晃動 / 直線動揺 / STRAIGHT-TRACK MOTION
	// 模擬軌道不整的隨機晃動；倍率可用 DataMap 增減。 / 軌道狂いを模したランダム動揺；倍率はDataMapで増減できます。 / Random motion imitating track irregularity; the scale can be adjusted via DataMap.
	//----------------------------------------------------------------------
	straight: {
		defaultScale: 0.70,      // 直線晃動預設倍率；0=關閉 / 直線動揺の既定倍率；0=無効 / Default straight-track motion scale; 0 disables it.
		dataMapKey: "BodyMotionStraightAdjust", // DataMap 增減量（double）；最終倍率=defaultScale+此值 / DataMap増減量（double）；最終倍率=defaultScale+この値 / DataMap adjustment (double); final scale = defaultScale + this value.
		maxScale: 4.00,          // 最終倍率上限 / 最終倍率上限 / Upper bound of the final scale.
		// 以隨機激振驅動車體彈簧，輸出落在固有頻率且幅度自然起伏；以下為倍率1.0、高速時的標準差。 / ランダム加振で車体ばねを駆動し、固有周波数で振幅が自然に揺らぎます。以下は倍率1.0・高速時の標準偏差です。 / Random excitation drives the body springs so motion sits at the natural frequency with a varying envelope; values are standard deviations at scale 1.0 and full speed.
		rollStdDeg: 0.12,        // 直線橫搖標準差；參考影片實測約 0.12° / 直線ロール標準偏差；参考動画の実測約0.12° / Straight roll standard deviation; reference video measures about 0.12°.
		swayStdM: 0.004,         // 直線橫移標準差 / 直線横変位標準偏差 / Straight sway standard deviation.
		bounceStdM: 0.0015,      // 直線上下標準差 / 直線上下動標準偏差 / Straight bounce standard deviation.
		minSpeedKmh: 3.0,        // 低於此速度不晃動 / この速度未満は動揺なし / No motion below this speed.
		referenceSpeedKmh: 50.0  // 幅度隨速度成長的基準；此速度約達63% / 速度による振幅成長の基準；この速度で約63% / Speed reference for amplitude growth; about 63% at this speed.
	},
	//----------------------------------------------------------------------
	// 道岔衝擊 / 分岐器衝撃 / TURNOUT IMPACTS
	// 通過尖軌與轍叉時的衝擊。 / トングレールとクロッシング通過時の衝撃。 / Impacts when passing the switch toe and frog crossing.
	//----------------------------------------------------------------------
	turnout: {
		// 道岔衝擊直接激起車體本身的橫搖／橫移擺動（與彎道同一模式）。 / 分岐器衝撃は車体自身のロール・横変位振動（曲線と同じモード）を励起します。 / Turnout impacts excite the body's own roll/sway mode, the same one used by curves.
		minSpeedFactor: 0.45,      // 高速時仍保留的最小晃動比例 / 高速時にも残す最小動揺率 / Minimum turnout motion retained at high speed.
		speedFalloffKmh: 60.0,     // 速度衰減基準；越大則高速衰減越慢 / 速度減衰基準；大きいほど高速でも強い / Speed falloff reference; higher retains more effect at speed.
		toePeakRollDeg: 0.20,      // 尖軌橫搖峰值 / トングレールのロールピーク / Switch-toe roll peak.
		toePeakSwayM: 0.005,       // 尖軌橫移峰值 / トングレールの横変位ピーク / Switch-toe sway peak.
		toeBounceImpulse: 0.038,   // 尖軌上下震動 / トングレールの上下動 / Switch-toe vertical impulse.
		frogPeakRollDeg: 0.60,     // 轍叉 X 處橫搖峰值 / クロッシング部のロールピーク / Frog-crossing roll peak.
		frogPeakSwayM: 0.015,      // 轍叉 X 處橫移峰值 / クロッシング部の横変位ピーク / Frog-crossing sway peak.
		frogBounceImpulse: 0.128,  // 轍叉 X 處上下震動 / クロッシング部の上下動 / Frog-crossing vertical impulse.
		bounceFrequencyHz: 2.10,   // 道岔上下回彈頻率 / 分岐器上下動周波数 / Turnout bounce frequency.
		bounceDamping: 0.1297      // 道岔上下回彈持續時間 / 分岐器上下動減衰 / Turnout bounce damping.
	},
	//----------------------------------------------------------------------
	// 制動與停車衝動 / 制動・停止衝動 / BRAKING AND STOP SHOCK
	// 急制動建立與停車瞬間的前後俯仰、前後位移。 / 急制動の立ち上がりと停止瞬間の前後ピッチ・前後変位。 / Fore-aft pitch and longitudinal shift when emergency braking builds up and at the moment of stopping.
	//----------------------------------------------------------------------
	stop: {
		maxPitchDeg: 0.65,              // 制動相關最大俯仰角 / 制動系の最大ピッチ角 / Maximum braking-related pitch angle.
		maxShiftM: 0.040,               // 制動相關最大前後位移 / 制動系の最大前後変位 / Maximum braking-related longitudinal shift.
		emergencyDecelMps2: 1.15,       // 急制動判定減速度 / 急制動判定の減速度 / Deceleration threshold for emergency response.
		emergencyJerkMps3: 2.00,        // 急制動判定減速度變化率 / 急制動判定のジャーク / Jerk threshold for emergency response.
		emergencyPitchImpulse: 0.0376,  // 急制動上下俯仰衝量 / 急制動時のピッチ衝撃 / Emergency-brake pitch impulse.
		emergencyShiftImpulseM: 0.020,  // 急制動前後位移衝量 / 急制動時の前後変位衝撃 / Emergency-brake longitudinal impulse.
		minimumBrakeLevel: 5,           // B5 起才顯示停車衝動 / B5以上で停止衝動を表示 / Stop shock begins at B5.
		minimumDecelMps2: 0.75,         // 停車衝動最低近期減速度 / 停止衝動の最小減速度 / Minimum recent deceleration for stop shock.
		pitchImpulse: 0.098,            // 停車前後俯仰強度 / 停止時ピッチ強度 / Stop pitch impulse.
		shiftImpulseM: 0.026,           // 停車前後位移強度 / 停止時前後変位強度 / Stop longitudinal-shift impulse.
		notchFactors: [0.0, 0.0, 0.0, 0.0, 0.0, 0.50, 0.75, 1.05, 1.45], // B5/B6/B7/EB 倍率 / B5/B6/B7/EB倍率 / B5/B6/B7/EB multipliers.
		pitchFrequencyHz: 0.72,         // 停車俯仰回彈頻率 / 停止ピッチ周波数 / Stop-pitch frequency.
		pitchDamping: 0.14,             // 停車俯仰持續時間 / 停止ピッチ減衰 / Stop-pitch damping.
		shiftFrequencyHz: 0.78,         // 停車前後位移頻率 / 停止前後変位周波数 / Stop-shift frequency.
		shiftDamping: 0.28              // 停車前後位移持續時間 / 停止前後変位減衰 / Stop-shift damping.
	},
	//----------------------------------------------------------------------
	// 乘客載重懸吊 / 乗客荷重サスペンション / PASSENGER-LOAD SUSPENSION
	// 偵測站在或坐在本節車上的玩家與 NPC：載重偏向的一側下沉（例：從左門下車→左側變輕→車體倒向右側），再由空氣彈簧調平閥慢慢回到水平。 /
	// 本車に立つ・座るプレイヤーとNPCを検出し、荷重の偏った側が沈みます（例：左扉から降車→左が軽くなり車体は右へ傾く）。その後、空気ばねの自動高さ調整弁でゆっくり水平へ戻ります。 /
	// Detects players and NPCs standing or seated in this car: the loaded side sinks (e.g. alighting from the left door lightens the left, so the body tilts right), then the air-spring leveling valve slowly restores level.
	// 真實一人約 70 kg、一節車約 30 t，實際傾斜僅約 0.01～0.05°；以下數值為可見度而放大。 / 実際は1人約70 kg・1両約30 tで傾きは約0.01～0.05°しかなく、以下は視認性のため誇張した値です。 / Real tilt is only ~0.01-0.05° (70 kg person vs ~30 t car); the values below are exaggerated for visibility.
	// 支援 1.7.10（KaizPatchX）、1.12.2（RTM 2.4.x）、RTMU 1.21.1；版本差異由 RTMBodyMotionAdapter.js 處理。 / 1.7.10（KaizPatchX）・1.12.2（RTM 2.4.x）・RTMU 1.21.1に対応し、版差はRTMBodyMotionAdapter.jsが吸収します。 / Supports 1.7.10 (KaizPatchX), 1.12.2 (RTM 2.4.x) and RTMU 1.21.1; RTMBodyMotionAdapter.js absorbs the version differences.
	//----------------------------------------------------------------------
	load: {
		enabled: true,                 // 是否啟用乘客載重效果 / 乗客荷重効果を有効にするか / Enable the passenger-load effect.
		rollPerPersonDeg: 0.15,        // 一人站在車門位置（rollReferenceWidthM）時的傾斜角 / 1人が扉位置（rollReferenceWidthM）に立った時の傾斜角 / Tilt per person standing at the door position (rollReferenceWidthM).
		levelingTimeS: 3.5,            // 空氣彈簧調平時間常數；越小回正越快 / 空気ばね高さ調整の時定数；小さいほど早く水平に戻る / Air-spring leveling time constant; smaller returns to level faster.
		countNpcs: true,               // 是否把 NPC、村民等非玩家生物也算進載重 / NPC・村人など非プレイヤー生物も荷重に含めるか / Count NPCs, villagers and other non-player living entities.
		npcWeight: 1.0,                // NPC 相對於玩家的重量倍率 / プレイヤーに対するNPCの重量倍率 / NPC weight relative to a player.
		pitchPerPersonDeg: 0.05,       // 一人站在車端時的前後俯仰角 / 1人が車端に立った時の前後ピッチ角 / Fore-aft pitch per person standing at the car end.
		sinkPerPersonM: 0.0015,        // 每人造成的整體下沉量（之後同樣調平回升） / 1人あたりの全体沈下量（その後同様に復帰） / Overall sink per person, also leveled back afterwards.
		maxRollDeg: 0.80,              // 載重傾斜上限 / 荷重傾斜の上限 / Maximum load-induced roll.
		maxPitchDeg: 0.30,             // 載重俯仰上限 / 荷重ピッチの上限 / Maximum load-induced pitch.
		maxSinkM: 0.010,               // 載重下沉上限 / 荷重沈下の上限 / Maximum load-induced sink.
		boardKickRollDeg: 0.12,        // 上下車瞬間的踏步衝擊峰值（車門位置一人）；上車往該側沉、下車反彈，之後來回晃動；0=關閉 / 乗降瞬間の踏み込み衝撃ピーク（扉位置1人）；乗車側へ沈み降車で跳ね返り、その後揺れ返す；0=無効 / Step-on/off jolt peak per person at the door; boarding dips that side, alighting rebounds, then it swings; 0 disables.
		boardKickSinkM: 0.002,         // 上下車瞬間的上下衝擊峰值（每人） / 乗降瞬間の上下衝撃ピーク（1人あたり） / Vertical jolt peak per person at the moment of boarding or alighting.

		// —— 進階：一般不需修改 / 上級：通常は変更不要 / Advanced: normally leave as is ——
		inputSmoothingS: 0.30,         // 載重輸入平滑時間，減少車內走動造成的細碎抖動 / 荷重入力の平滑時間；車内歩行による細かな揺れを抑える / Load-input smoothing time; damps jitter from walking inside the car.
		rollReferenceWidthM: 1.40,     // 車門位置距中心線的寬度；站在此處即為一人份傾斜 / 扉位置の中心線からの距離；ここで1人分の傾斜 / Door distance from the centerline; standing here gives one person's tilt.
		carHalfWidthM: 1.55,           // 判定在車內的半寬 / 車内判定の半幅 / Half width counted as inside the car.
		carHalfLengthM: 0.0,           // 判定在車內的半長；0=自動讀取車輛設定 trainDistance / 車内判定の半長；0=車両設定trainDistanceを自動取得 / Half length counted as inside; 0 reads trainDistance from the vehicle config.
		fallbackHalfLengthM: 10.0,     // 自動讀取失敗時的半長 / 自動取得失敗時の半長 / Half length used when auto-detection fails.
		feetBelowFloorM: 2.5,          // 腳底低於地板估計值此值以內仍算在車上；實測平走進車時腳底比估計低 1 m 以上（只有跳進去才被偵測），故放寬 / 足元が推定床よりこの値以内下でも乗車扱い；実測で平地歩行の乗車は推定より1 m以上低く（ジャンプ時のみ検出）、範囲を広げました / Feet up to this far below the estimated floor still count; in-game, walking in put the feet over 1 m below the estimate (only jumping was detected), so this is widened.
		feetAboveFloorM: 2.2,          // 腳底高於地板此值以內算在車上；可排除站在車頂的人 / 足元が床よりこの値以内上なら乗車扱い；屋根上の人を除外 / Feet up to this far above the floor count as aboard; excludes people on the roof.
		floorOffsetM: { legacy1710: 0.0, legacy1122: 1.1875, rtmu: 1.1875 }, // 地板相對列車 posY 的高度（依版本） / 列車posYからの床高さ（版別） / Floor height above the train's posY per platform.
		legacyPlayerEyeOffsetM: 1.62,  // 1.7.10 玩家 posY 的眼高偏移 / 1.7.10プレイヤーposYの目線オフセット / Eye offset included in a 1.7.10 player's posY.
		excludedClassNames: []         // 不計入載重的實體類別全名（例：自訂裝飾實體） / 荷重に含めないエンティティのクラス完全名（例：独自の装飾エンティティ） / Fully qualified entity class names to ignore (e.g. custom decoration entities).
	},
	//----------------------------------------------------------------------
	// 除錯 / デバッグ / DEBUG
	// 平常保持預設值；只在排查問題時開啟。 / 通常は既定値のまま；問題調査時のみ有効にします。 / Keep the defaults normally; enable only when diagnosing problems.
	//----------------------------------------------------------------------
	debug: {
		// true 時每 5 秒在記錄檔輸出 partialTick 統計，用來確認幀間插值是否正常。 / trueで5秒ごとにpartialTick統計をログ出力し、フレーム補間を確認します。 / When true, log partialTick statistics every 5 s to verify frame interpolation.
		logPartialTick: false,
		// true 時在乘客人數或位置明顯改變時於記錄檔輸出每節車的載重偵測結果，用來確認上下車是否被偵測到。 / trueで乗客数や位置が大きく変わった時、各車の荷重検出結果をログ出力し、乗降が検出されているか確認します。 / When true, log each car's detected load whenever passenger count or position changes noticeably, to confirm boarding/alighting is detected.
		logLoad: false,
		// 描畫對照實驗（找出白色細縫的來源用；平常保持 0）。 / 描画対照実験（白い細線の原因調査用；通常は0）。 / Rendering A/B test for locating the thin white seam line; keep 0 normally.
		// 0＝正常；1＝完全不套用車體晃動；2＝只有平移（不旋轉）；3＝只有旋轉（不平移）；4＝發光 Pass 不使用深度偏移與關閉深度寫入（還原為原作者的設定）。 /
		// 0＝通常；1＝車体動揺を一切適用しない；2＝平行移動のみ（回転なし）；3＝回転のみ（平行移動なし）；4＝発光Passで深度オフセットと深度書込停止を使わない（原作者の設定に戻す）。 /
		// 0 = normal; 1 = no body motion at all; 2 = translation only (no rotation); 3 = rotation only (no translation); 4 = emissive pass without polygon offset / depth-write disable (original author's setup).
		renderTest: 0
	}
};

// 深層合併：物件逐鍵合併；陣列與數值整個取代。車輛腳本只需寫要改的項目。 / 深いマージ：オブジェクトはキーごと、配列と値は丸ごと置換。車両スクリプトは変更する項目だけ書けば十分です。 / Deep merge: objects merge key by key; arrays and values are replaced whole. Vehicle scripts only need the entries they change.
function motionMergeTuning(base, override) {
	var out = {};
	for (var k in base) {
		if (!base.hasOwnProperty(k)) continue;
		var bv = base[k];
		var has = override != null && override.hasOwnProperty(k);
		var ov = has ? override[k] : undefined;
		if (bv !== null && typeof bv === "object" && !(bv instanceof Array)) {
			out[k] = motionMergeTuning(bv, (has && ov !== null && typeof ov === "object") ? ov : null);
		} else {
			out[k] = has ? ov : bv;
		}
	}
	if (override != null) {
		for (var extra in override) {
			if (override.hasOwnProperty(extra) && !out.hasOwnProperty(extra)) out[extra] = override[extra];
		}
	}
	return out;
}


//=============================================================================
// 內部設定對應 / 内部設定マッピング / INTERNAL CONFIG MAPPING
//=============================================================================
// 一般調校請勿直接改此區。 / 通常の調整ではこの欄を直接変更しないでください。 / Do not edit this block for normal tuning.
// RTM 已套用軌道超高，本模組只增加二次懸吊的相對晃動。 / RTM側のカントに二重加算せず、二次ばね相当の相対動揺だけを追加します。 / RTM already applies track cant; this module adds only secondary-suspension relative motion.
var MOTION_BODY_ROLL_HZ = 0.0;
var MOTION_BODY_SWAY_HZ = 0.0;
var MOTION_BODY_BOUNCE_HZ = 2.10;
var MOTION_BODY_BOUNCE_DAMPING = 0.62;
var motionTuning = null;
var motionConfig = null;

// 由「預設值＋車輛腳本的 MOTION_TUNING」建立內部設定。 / 「既定値＋車両スクリプトのMOTION_TUNING」から内部設定を作ります。 / Build the internal config from the defaults merged with the vehicle script's motionTuning.
function motionBuildConfig() {
	motionTuning = motionMergeTuning(MOTION_DEFAULT_TUNING,
		(typeof MOTION_TUNING !== "undefined" && MOTION_TUNING) ? MOTION_TUNING : null);
	MOTION_BODY_ROLL_HZ = motionTuning.curve.rollFrequencyHz / motionTuning.curve.sluggishnessScale;
	MOTION_BODY_SWAY_HZ = motionTuning.curve.swayFrequencyHz / motionTuning.curve.sluggishnessScale;

	motionConfig = {
		gravity: 9.80665,
		gaugeMm: 1067.0,
		maxRoll: motionTuning.curve.maxRollDeg,
		maxSway: motionTuning.curve.maxSwayM,
		maxPitch: motionTuning.stop.maxPitchDeg,
		maxShift: motionTuning.stop.maxShiftM,
		pivotY: 1.15,
		springMaxStep: 0.0050,
		emergencyDecel: motionTuning.stop.emergencyDecelMps2,
		emergencyJerk: motionTuning.stop.emergencyJerkMps3,
		emergencyPitchImpulse: motionTuning.stop.emergencyPitchImpulse,
		emergencyShiftImpulse: motionTuning.stop.emergencyShiftImpulseM,
		stopDecel: motionTuning.stop.minimumDecelMps2,
		stopMinBrakeLevel: motionTuning.stop.minimumBrakeLevel,
		stopPitchImpulse: motionTuning.stop.pitchImpulse,
		stopShiftImpulse: motionTuning.stop.shiftImpulseM,
		stopNotchFactors: motionTuning.stop.notchFactors,
		stopPitchFrequency: motionTuning.stop.pitchFrequencyHz,
		stopPitchDamping: motionTuning.stop.pitchDamping,
		stopShiftFrequency: motionTuning.stop.shiftFrequencyHz,
		stopShiftDamping: motionTuning.stop.shiftDamping,
		switchMinSpeedFactor: motionTuning.turnout.minSpeedFactor,
		switchSpeedFalloffKmh: motionTuning.turnout.speedFalloffKmh,
		// 道岔橫搖／橫移以峰值指定，換算成車體彈簧的初速度。 / 分岐器のロール・横変位はピーク指定で、車体ばねの初速度へ換算します。 / Turnout roll/sway peaks are converted to body-spring initial velocities.
		switchToeRollImpulse: motionPeakToVelocity(motionTuning.turnout.toePeakRollDeg, MOTION_BODY_ROLL_HZ, motionTuning.curve.rollDamping),
		switchToeSwayImpulse: motionPeakToVelocity(motionTuning.turnout.toePeakSwayM, MOTION_BODY_SWAY_HZ, motionTuning.curve.swayDamping),
		switchToeBounceImpulse: motionTuning.turnout.toeBounceImpulse,
		switchFrogRollImpulse: motionPeakToVelocity(motionTuning.turnout.frogPeakRollDeg, MOTION_BODY_ROLL_HZ, motionTuning.curve.rollDamping),
		switchFrogSwayImpulse: motionPeakToVelocity(motionTuning.turnout.frogPeakSwayM, MOTION_BODY_SWAY_HZ, motionTuning.curve.swayDamping),
		switchFrogBounceImpulse: motionTuning.turnout.frogBounceImpulse,
		switchTriggerRadius: 1.25,
		switchToeCooldownTicks: 10,
		switchFrogCooldownTicks: 12,
		switchBounceFrequency: motionTuning.turnout.bounceFrequencyHz,
		switchBounceDamping: motionTuning.turnout.bounceDamping,
		bodyRollFrequency: MOTION_BODY_ROLL_HZ,
		bodyRollDamping: motionTuning.curve.rollDamping,
		bodySwayFrequency: MOTION_BODY_SWAY_HZ,
		bodySwayDamping: motionTuning.curve.swayDamping,
		bodyBounceFrequency: MOTION_BODY_BOUNCE_HZ,
		bodyBounceDamping: MOTION_BODY_BOUNCE_DAMPING,
		curveInputFilterRate: Math.PI * 2.0 * motionTuning.curve.inputFilterHz,
		curveMinSpeed: motionTuning.curve.minSpeedMps,
		curveMinDeficiencyMm: motionTuning.curve.minCantDeficiencyMm,
		// 由目標峰值反推初速度，頻率改變時幅度不變。 / 目標ピークから初速度を逆算し、周波数を変えても振幅を保ちます。 / Derive the initial velocity from the target peak so amplitude is independent of frequency.
		curveRollPeakVelocity: motionPeakToVelocity(
			motionTuning.curve.peakRollDeg * motionTuning.curve.amplitudeScale,
			MOTION_BODY_ROLL_HZ, motionTuning.curve.rollDamping),
		curveSwayPeakVelocity: motionPeakToVelocity(
			motionTuning.curve.peakSwayM * motionTuning.curve.amplitudeScale,
			MOTION_BODY_SWAY_HZ, motionTuning.curve.swayDamping),
		curveSaturationMm: motionTuning.curve.saturationMm,
		curveLeanRoll: motionTuning.curve.leanRollDeg * motionTuning.curve.amplitudeScale,
		curveLeanSway: motionTuning.curve.leanSwayM * motionTuning.curve.amplitudeScale,
		// 單一事件累計注入量（含增減）的安全上限，以峰值初速度的倍數表示。 / 単一イベント累計注入量（増減含む）の安全上限。ピーク初速度の倍数。 / Safety cap on total injection (both directions) per event, as a multiple of the peak velocity.
		curveInjectionCapFactor: 2.0,
		curveExitFactor: motionTuning.curve.exitResponseFactor,
		curveReverseExitFactor: motionTuning.curve.reverseExitFactor,
		curveEventEnterAcceleration: 0.008,
		curveEventExitAcceleration: 0.004,
		curveEventStageThreshold: motionTuning.curve.stageThreshold,
		curveEventStageHoldTicks: motionTuning.curve.stageHoldTicks,
		curveEventExitHoldTicks: motionTuning.curve.exitHoldTicks,
		straightDefaultScale: motionTuning.straight.defaultScale,
		straightDataMapKey: motionTuning.straight.dataMapKey,
		straightMaxScale: motionTuning.straight.maxScale,
		// 白雜訊驅動的阻尼彈簧，穩態變異數為 σ²/(4ζω³)；由目標標準差反求 σ。 / 白色雑音で駆動する減衰ばねの定常分散はσ²/(4ζω³)で、目標標準偏差からσを逆算します。 / A damped spring driven by white noise has stationary variance σ²/(4ζω³); solve σ from the target standard deviation.
		straightRollNoise: motionNoiseForStd(motionTuning.straight.rollStdDeg, MOTION_BODY_ROLL_HZ, motionTuning.curve.rollDamping),
		straightSwayNoise: motionNoiseForStd(motionTuning.straight.swayStdM, MOTION_BODY_SWAY_HZ, motionTuning.curve.swayDamping),
		straightBounceNoise: motionNoiseForStd(motionTuning.straight.bounceStdM, MOTION_BODY_BOUNCE_HZ, MOTION_BODY_BOUNCE_DAMPING),
		straightMinSpeedKmh: motionTuning.straight.minSpeedKmh,
		straightReferenceSpeedKmh: motionTuning.straight.referenceSpeedKmh,
		straightScaleFilter: 2.0,     // DataMap 倍率變化的平滑速度（1/s） / DataMap倍率変化の平滑速度（1/s） / Smoothing rate for DataMap scale changes (1/s).
		maxBounce: 0.012,
		loadEnabled: motionTuning.load.enabled,
		loadRollPerPerson: motionTuning.load.rollPerPersonDeg,
		loadPitchPerPerson: motionTuning.load.pitchPerPersonDeg,
		loadSinkPerPerson: motionTuning.load.sinkPerPersonM,
		loadMaxRoll: motionTuning.load.maxRollDeg,
		loadMaxPitch: motionTuning.load.maxPitchDeg,
		loadMaxSink: motionTuning.load.maxSinkM,
		loadLevelingTime: Math.max(0.1, motionTuning.load.levelingTimeS),
		loadSmoothingTime: Math.max(0.05, motionTuning.load.inputSmoothingS),
		loadCountNpcs: motionTuning.load.countNpcs,
		loadNpcWeight: motionTuning.load.npcWeight,
		loadReferenceWidth: motionTuning.load.rollReferenceWidthM,
		loadHalfWidth: motionTuning.load.carHalfWidthM,
		loadHalfLength: motionTuning.load.carHalfLengthM,
		loadFallbackHalfLength: motionTuning.load.fallbackHalfLengthM,
		loadFeetBelow: motionTuning.load.feetBelowFloorM,
		loadFeetAbove: motionTuning.load.feetAboveFloorM,
		loadFloorOffsets: motionTuning.load.floorOffsetM,
		loadLegacyEyeOffset: motionTuning.load.legacyPlayerEyeOffsetM,
		loadExcludedClasses: motionArrayToSet(motionTuning.load.excludedClassNames),
		// 踏步衝擊以峰值指定，換算成車體彈簧初速度。 / 踏み込み衝撃はピーク指定で、車体ばね初速度へ換算します。 / Step jolts are given as peaks and converted to body-spring initial velocities.
		loadKickRollVelocity: motionPeakToVelocity(motionTuning.load.boardKickRollDeg, MOTION_BODY_ROLL_HZ, motionTuning.curve.rollDamping),
		loadKickSinkVelocity: motionPeakToVelocity(motionTuning.load.boardKickSinkM, MOTION_BODY_BOUNCE_HZ, MOTION_BODY_BOUNCE_DAMPING),
		debugLogLoad: motionTuning.debug.logLoad,
		debugLogPartialTick:motionTuning.debug.logPartialTick,
		// partialTick 連續此 Tick 數皆為 0 且每 Tick 多於 1.5 幀時，改用系統時鐘插值。 / partialTickがこのTick数連続で0かつ1Tickあたり1.5フレーム超なら、システム時計補間に切り替えます。 / Switch to clock-based interpolation when partialTick stays 0 for this many ticks at more than 1.5 frames per tick.
		partialTickProbeTicks: 100
	};
	return motionConfig;
}

// 第一次使用時才建立設定：即使車輛腳本把 MOTION_TUNING 寫在載入本模組之後也能讀到。 / 初回使用時に設定を作るため、車両スクリプトがMOTION_TUNINGを本モジュールの読込より後に書いても読めます。 / Build lazily on first use, so MOTION_TUNING is picked up even if the vehicle script defines it after loading this module.
function motionEnsureConfig() {
	if (motionConfig === null) motionBuildConfig();
}
if (typeof MOTION_TUNING !== "undefined" && MOTION_TUNING) motionBuildConfig();


var motionStates = {};
var motionLastCleanupTick = -1;
var motionSwitchPointCache = {};
var motionSwitchPointCacheSize = 0;

//=============================================================================
// 模組 A：數學與插值 / モジュールA：数学と補間 / MODULE A: MATH AND INTERPOLATION
//=============================================================================
function motionClamp(value, min, max) {
	return value < min ? min : (value > max ? max : value);
}

function motionSign(value) {
	return value < 0 ? -1 : (value > 0 ? 1 : 0);
}

// 多通道疊加時平滑壓縮末端，避免硬截斷。 / 複数チャンネルの合成時に末端を滑らかに圧縮し、急なクリップを防ぎます。 / Soft-limit combined channels to avoid hard clipping.
function motionSoftLimit(value, limit) {
	var absolute = Math.abs(value);
	var knee = limit * 0.72;
	if (absolute <= knee) return value;
	var room = limit - knee;
	var compressed = knee + room * (1.0 - Math.exp(-(absolute - knee) / room));
	return motionSign(value) * Math.min(compressed, limit);
}

function motionWrapAngle(angle) {
	while (angle > 180.0) angle -= 360.0;
	while (angle < -180.0) angle += 360.0;
	return angle;
}

// 舊版 Nashorn（ES5.1）沒有 Math.tanh。 / 旧Nashorn（ES5.1）にはMath.tanhがありません。 / Legacy Nashorn (ES5.1) lacks Math.tanh.
function motionTanh(value) {
	if (value > 20.0) return 1.0;
	if (value < -20.0) return -1.0;
	var e2 = Math.exp(2.0 * value);
	return (e2 - 1.0) / (e2 + 1.0);
}

// 阻尼彈簧自 0 以初速度 v0 出發的首個峰值為 v0/ω×exp(-ζ/√(1-ζ²)×atan(√(1-ζ²)/ζ))；此處反求 v0。 / 減衰ばねが0から初速度v0で動く最初のピークはv0/ω×exp(-ζ/√(1-ζ²)×atan(√(1-ζ²)/ζ))で、ここではv0を逆算します。 / The first peak of a damped spring launched from 0 at v0 is v0/ω×exp(-ζ/√(1-ζ²)×atan(√(1-ζ²)/ζ)); solve for v0.
function motionPeakToVelocity(peak, frequency, damping) {
	var omega = Math.PI * 2.0 * frequency;
	var zeta = Math.min(Math.max(damping, 0.0), 0.999);
	var root = Math.sqrt(1.0 - zeta * zeta);
	var attenuation = zeta > 0.0 ? Math.exp(-zeta / root * Math.atan(root / zeta)) : 1.0;
	return peak * omega / attenuation;
}

// 白雜訊驅動的阻尼彈簧 x''+2ζωx'+ω²x=σξ 穩態標準差為 σ/√(4ζω³)；此處反求 σ。 / 白色雑音駆動の減衰ばねの定常標準偏差はσ/√(4ζω³)で、ここではσを逆算します。 / A white-noise-driven damped spring has stationary std σ/√(4ζω³); solve for σ.
function motionNoiseForStd(std, frequency, damping) {
	var omega = Math.PI * 2.0 * frequency;
	return std * Math.sqrt(4.0 * Math.max(damping, 0.001) * omega * omega * omega);
}

function motionArrayToSet(list) {
	var set = {};
	if (list) for (var i = 0; i < list.length; ++i) set[String(list[i])] = true;
	return set;
}

// Park–Miller 亂數；倍數乘積小於 2^53，在 double 下精確，舊版 Nashorn 亦可用。 / Park–Miller乱数。積が2^53未満のためdoubleで正確で、旧Nashornでも動作します。 / Park–Miller RNG; products stay below 2^53 so doubles are exact, and it runs on legacy Nashorn.
function motionNextRandom(state) {
	state.noiseSeed = (state.noiseSeed * 16807) % 2147483647;
	return state.noiseSeed / 2147483647;
}

// Box–Muller 常態分布亂數。 / Box–Muller正規乱数。 / Box–Muller standard normal sample.
function motionGaussian(state) {
	var u1 = Math.max(motionNextRandom(state), 1e-12);
	var u2 = motionNextRandom(state);
	return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI * 2.0 * u2);
}

//=============================================================================
// 模組 B：RTM 輸入與軌道資料 / モジュールB：RTM入力と軌道情報 / MODULE B: RTM INPUT AND TRACK DATA
//=============================================================================
var motionTickSource = "clock";

// 狀態更新的時間基準必須與 RTM 傳入的 partialTick 同一套 tick，否則每個 tick 會出現前後各跳一次的鋸齒抖動。
// 優先順序：列車實體的 tick 計數 → 世界總時間 → 系統時鐘（最後手段，與 partialTick 不同步）。 /
// 状態更新の時間基準はRTMが渡すpartialTickと同じtickでなければならず、ずれると毎tick前後に1回ずつ跳ねる鋸歯状のちらつきが出ます。
// 優先順位：列車実体のtickカウンタ → ワールド総時間 → システム時計（最終手段、partialTickと非同期）。 /
// The state clock must use the same ticks as RTM's partialTick, otherwise the pose jumps forward and back once each per tick (sawtooth jitter).
// Priority: the train entity's tick counter, then total world time, then the system clock (last resort, not in step with partialTick).
function motionGetTick(entity) {
	var tick = RTMBodyMotionAdapter.getEntityTick(entity);
	if (tick !== null) { motionTickSource = "entity"; return tick; }
	tick = RTMBodyMotionAdapter.getWorldTick();
	if (tick !== null) { motionTickSource = "world"; return tick; }
	motionTickSource = "clock";
	return motionWallTick();
}

// 與列車無關的全域時鐘（每 50 ms 一格），供清理過期狀態與 partialTick 統計使用；各列車的 tick 計數不同，不能混用。 /
// 列車に依存しない全体時計（50 msごと）で、期限切れ状態の掃除とpartialTick統計に使います。列車ごとのtickカウンタは異なるため混用できません。 /
// Train-independent global clock (one step per 50 ms) for stale-state cleanup and partialTick statistics; per-train tick counters differ and must not be mixed.
function motionWallTick() {
	return Math.floor(motionNowNanos() / 50000000.0);
}

function motionReadCant(entity) {
	return RTMBodyMotionAdapter.readCantDegrees(entity);
}

function motionReadBrakeLevel(entity) {
	// RTM 級位：動力為正，B1～B7 為 -1～-7，EB 為 -8。 / RTMノッチ：力行は正、B1～B7は-1～-7、EBは-8です。 / RTM notch values: power is positive, B1-B7 are -1 to -7, and EB is -8.
	// RTMU 的包裝物件可能沒有 getNotch()，先讀實體本身。 / RTMUのラッパーにはgetNotch()がない場合があるため、実体を先に読みます。 / RTMU wrappers may lack getNotch(), so read the raw entity first.
	var targets = [RTMBodyMotionAdapter.unwrapEntity(entity), entity];
	for (var i = 0; i < targets.length; ++i) {
		try {
			var notch = Number(targets[i].getNotch());
			if (!isFinite(notch)) continue;
			return notch < 0.0 ? motionClamp(Math.round(-notch), 0, 8) : 0;
		} catch (e) {}
	}
	return 0;
}

// 直線晃動最終倍率＝預設值＋DataMap 增減量；DataMap 未設定時讀到 0，即維持預設值。 / 直線動揺の最終倍率＝既定値＋DataMap増減量。未設定時は0となり既定値のままです。 / Final straight scale = default + DataMap adjustment; an unset key reads 0, keeping the default.
function motionReadStraightScale(entity) {
	var adjust = RTMBodyMotionAdapter.readDataMapDouble(entity, motionConfig.straightDataMapKey, 0.0);
	return motionClamp(motionConfig.straightDefaultScale + adjust, 0.0, motionConfig.straightMaxScale);
}

// 高速時接近 1、低速時趨近 0 的直線晃動速度係數。 / 高速で1、低速で0に近づく直線動揺の速度係数です。 / Speed factor for straight motion: near 1 at speed, approaching 0 when slow.
function motionStraightSpeedFactor(speedKmh) {
	var effective = speedKmh - motionConfig.straightMinSpeedKmh;
	if (effective <= 0.0) return 0.0;
	return 1.0 - Math.exp(-effective / motionConfig.straightReferenceSpeedKmh);
}

// 直線軌道不整激振：每 Tick 對車體彈簧速度加入白雜訊，輸出自然落在固有頻率。 / 直線軌道狂い加振：毎Tick車体ばね速度へ白色雑音を加え、出力は固有周波数に自然に集まります。 / Straight-track excitation: add white noise to body-spring velocities each tick so output settles at the natural frequency.
function motionApplyStraightExcitation(state, speedKmh, dt) {
	var gain = motionStraightSpeedFactor(speedKmh) * state.straightScale;
	if (gain <= 0.0) return;
	var root = Math.sqrt(dt) * gain;
	state.rollVelocity += motionConfig.straightRollNoise * root * motionGaussian(state);
	state.swayVelocity += motionConfig.straightSwayNoise * root * motionGaussian(state);
	state.bounceVelocity += motionConfig.straightBounceNoise * root * motionGaussian(state);
}

function motionIsSwitchCore(core) {
	return RTMBodyMotionAdapter.isSwitchCore(core);
}

//=============================================================================
// 模組 C：道岔幾何與衝擊 / モジュールC：分岐器形状と衝撃 / MODULE C: TURNOUT GEOMETRY AND IMPACTS
//=============================================================================
function motionGetSwitchCore(bogieSample) {
	return RTMBodyMotionAdapter.getSwitchCore(bogieSample);
}

function motionSegmentDistanceSq(x0, z0, x1, z1, px, pz) {
	var dx = x1 - x0;
	var dz = z1 - z0;
	var lengthSq = dx * dx + dz * dz;
	if (lengthSq < 0.0000001) {
		var sx = px - x1;
		var sz = pz - z1;
		return sx * sx + sz * sz;
	}
	var t = motionClamp(((px - x0) * dx + (pz - z0) * dz) / lengthSq, 0.0, 1.0);
	var cx = x0 + dx * t;
	var cz = z0 + dz * t;
	var ex = px - cx;
	var ez = pz - cz;
	return ex * ex + ez * ez;
}

function motionGetSwitchImpactPoints(core, point) {
	if (point == null || point.rmBranch == null) return null;
	var root = point.rpRoot;
	var key = Number(MCWrapper.getPosX(core)) + ":" + Number(MCWrapper.getPosY(core)) + ":" + Number(MCWrapper.getPosZ(core)) + ":" +
		Number(root.posX).toFixed(3) + ":" + Number(root.posZ).toFixed(3);
	if (motionSwitchPointCache[key]) return motionSwitchPointCache[key];

	// 依 1067 mm 軌距計算鋼軌交點，並在 JS 端維持舊 RTM 相容。 / 1067 mm軌間でレール交点を計算し、旧RTM互換のためJS側で実装します。 / Compute rail intersections at 1067 mm gauge in JS for legacy RTM compatibility.
	var split = 96;
	var halfGauge = motionConfig.gaugeMm / 2000.0;
	var branchId = Number(point.branchDir.id);
	var vxMain = halfGauge *
		((point.mainDirIsPositive && branchId == 1) || (!point.mainDirIsPositive && branchId == -1) ? 1.0 : -1.0);
	var vxBranch = halfGauge *
		((point.branchDirIsPositive && branchId == -1) || (!point.branchDirIsPositive && branchId == 1) ? 1.0 : -1.0);
	// 兩條鋼軌各取樣 97 點並先算好；原寫法在內層迴圈對每個 i 重複查詢支線（約 1.9 萬次 Java 呼叫，列車首次經過道岔時可能卡一幀），
	// 現改為各查一次（約 200 次）。運算式與比較順序不變，因此選出的轍叉點完全相同。 /
	// 両レールを97点ずつ先に取得します。旧実装は内側ループでiごとに分岐線を再取得していました（約1.9万回のJava呼び出しで、初通過時に1フレーム詰まる恐れ）。
	// 現在は各1回（約200回）です。式と比較順は同じため、選ばれるクロッシング点は完全に同一です。 /
	// Sample each rail's 97 points once up front. The old inner loop re-queried the branch rail for every i (~19,000 Java calls, possibly a one-frame hitch on first passage);
	// now each is queried once (~200 calls). Expressions and comparison order are unchanged, so the chosen frog points are identical.
	var mainXs = [], mainZs = [], branchXs = [], branchZs = [];
	for (var s = 0; s <= split; ++s) {
		var posMainS = point.rmMain.getRailPos(split, s);
		var yawMainS = Number(point.rmMain.getRailRotation(split, s)) * Math.PI / 180.0;
		mainXs.push(Number(posMainS[1]) + vxMain * Math.cos(yawMainS));
		mainZs.push(Number(posMainS[0]) - vxMain * Math.sin(yawMainS));
	}
	for (var b = 0; b <= split; ++b) {
		var posBranchS = point.rmBranch.getRailPos(split, b);
		var yawBranchS = Number(point.rmBranch.getRailRotation(split, b)) * Math.PI / 180.0;
		branchXs.push(Number(posBranchS[1]) + vxBranch * Math.cos(yawBranchS));
		branchZs.push(Number(posBranchS[0]) - vxBranch * Math.sin(yawBranchS));
	}
	var bestMain = 0;
	var bestBranch = 0;
	var bestDistanceSq = 1000000000.0;
	for (var i = 0; i <= split; ++i) {
		var mainX = mainXs[i];
		var mainZ = mainZs[i];
		for (var j = 0; j <= split; ++j) {
			var difX = mainX - branchXs[j];
			var difZ = mainZ - branchZs[j];
			var distanceSq = difX * difX + difZ * difZ;
			if (distanceSq < bestDistanceSq) {
				bestDistanceSq = distanceSq;
				bestMain = i;
				bestBranch = j;
			}
		}
	}
	var impactMain = point.rmMain.getRailPos(split, bestMain);
	var impactBranch = point.rmBranch.getRailPos(split, bestBranch);
	var result = {
		// rpRoot 是本線與支線開始分離的尖軌基準點。 / rpRootは本線と分岐線が分かれ始めるトングレール基準点です。 / rpRoot marks the switch-toe origin where the routes begin to diverge.
		toe: [{x:Number(root.posX), z:Number(root.posZ)}],
		// 左右鋼軌呈 X 形交會的兩點作為轍叉衝擊點。 / 左右レールがX状に交差する2点をクロッシング衝撃点にします。 / Use the two X-shaped rail intersections as frog impact points.
		frog: [
			{x:Number(impactMain[1]), z:Number(impactMain[0])},
			{x:Number(impactBranch[1]), z:Number(impactBranch[0])}
		]
	};
	// 快取上限：超過時整批清空，之後需要時重新計算（結果相同），避免長時間遊玩後無限增長。 / キャッシュ上限：超えたら一括消去し必要時に再計算（結果同一）、長時間プレイでの無限増加を防ぎます。 / Cache cap: clear everything when exceeded and recompute on demand (same results), preventing unbounded growth over long sessions.
	if (++motionSwitchPointCacheSize > 512) {
		motionSwitchPointCache = {};
		motionSwitchPointCacheSize = 1;
	}
	motionSwitchPointCache[key] = result;
	return result;
}

function motionGetSwitchImpactDistancesSq(bogie, x0, z0, x1, z1) {
	try {
		var core = motionGetSwitchCore(bogie);
		if (core == null) return {toe:1000000000.0, frog:1000000000.0};
		var switchObj = core.getSwitch();
		var points = switchObj.getPoints();
		var bestToe = 1000000000.0;
		var bestFrog = 1000000000.0;
		for (var i = 0; i < points.length; ++i) {
			var impacts = null;
			try { impacts = motionGetSwitchImpactPoints(core, points[i]); } catch (pointError) {}
			// 特殊道岔無法計算轍叉時仍保留尖軌偵測。 / 特殊分岐器でクロッシング計算不能でもトング位置は検出します。 / Preserve switch-toe detection when frog geometry cannot be calculated.
			if (impacts == null && points[i] != null && points[i].rmBranch != null && points[i].rpRoot != null) {
				impacts = {
					toe:[{x:Number(points[i].rpRoot.posX), z:Number(points[i].rpRoot.posZ)}],
					frog:[]
				};
			}
			if (impacts == null) continue;
			for (var j = 0; j < impacts.toe.length; ++j) {
				bestToe = Math.min(bestToe,
					motionSegmentDistanceSq(x0, z0, x1, z1, impacts.toe[j].x, impacts.toe[j].z));
			}
			for (var k = 0; k < impacts.frog.length; ++k) {
				bestFrog = Math.min(bestFrog,
					motionSegmentDistanceSq(x0, z0, x1, z1, impacts.frog[k].x, impacts.frog[k].z));
			}
		}
		return {toe:bestToe, frog:bestFrog};
	} catch (e) {}
	return {toe:1000000000.0, frog:1000000000.0};
}

function motionApplySwitchImpulse(state, kind, direction, speedFactor) {
	var rollImpulse = kind == "frog" ?
		motionConfig.switchFrogRollImpulse : motionConfig.switchToeRollImpulse;
	var swayImpulse = kind == "frog" ?
		motionConfig.switchFrogSwayImpulse : motionConfig.switchToeSwayImpulse;
	var bounceImpulse = kind == "frog" ?
		motionConfig.switchFrogBounceImpulse : motionConfig.switchToeBounceImpulse;
	// 橫搖與橫移打進車體彈簧，與彎道、直線共用同一擺動模式。 / ロールと横変位は車体ばねへ入れ、曲線・直線と同じ振動モードを共有します。 / Roll and sway go into the body springs, sharing one mode with curves and straight track.
	state.rollVelocity += direction * rollImpulse * speedFactor;
	state.swayVelocity -= direction * swayImpulse * speedFactor;
	state.switchBounceVelocity += bounceImpulse * speedFactor;
}

//=============================================================================
// 模組 D：複合彎道事件 / モジュールD：複合曲線イベント / MODULE D: COMPOUND CURVE EVENTS
//=============================================================================
function motionResetCurveEvent(state) {
	state.curveActive = false;
	state.curveDirection = 0;
	state.curveReferenceMagnitude = 0.0;
	state.curveInjectedRoll = 0.0;
	state.curveInjectedSway = 0.0;
	state.curveStageSign = 0;
	state.curveStageTicks = 0;
	state.curveExitTicks = 0;
}

// 超高不足（以橫向加速度表示）對應的飽和響應比例 0～1；緩彎與急彎可區分，急彎則平滑趨近峰值。 / カント不足（横加速度表記）に対する飽和応答比0～1。緩曲線と急曲線を区別し、急曲線は滑らかにピークへ近づきます。 / Saturating response ratio 0-1 for cant deficiency (as lateral acceleration); gentle and sharp curves stay distinct while sharp ones approach the peak smoothly.
function motionCurveResponseRatio(magnitude) {
	var deficiencyMm = Math.abs(magnitude) * motionConfig.gaugeMm / motionConfig.gravity;
	return motionTanh(deficiencyMm / motionConfig.curveSaturationMm);
}

// 注入「目前響應－先前響應」，因此分段進彎的總注入量與一次進彎相同，且不超過峰值。 / 「現在応答－前回応答」を注入するため、段階的な進入でも総注入量は一括進入と同じで、ピークを超えません。 / Inject the response difference so staged entry totals the same as a single step and never exceeds the peak.
function motionApplyCurveStage(state, fromMagnitude, toMagnitude) {
	var ratioDelta = motionCurveResponseRatio(toMagnitude) - motionCurveResponseRatio(fromMagnitude);
	var rollCap = motionConfig.curveRollPeakVelocity * motionConfig.curveInjectionCapFactor;
	var swayCap = motionConfig.curveSwayPeakVelocity * motionConfig.curveInjectionCapFactor;
	var rollRoom = Math.max(0.0, rollCap - state.curveInjectedRoll);
	var swayRoom = Math.max(0.0, swayCap - state.curveInjectedSway);
	var rollImpulse = motionClamp(
		ratioDelta * motionConfig.curveRollPeakVelocity, -rollRoom, rollRoom);
	var swayImpulse = motionClamp(
		ratioDelta * motionConfig.curveSwayPeakVelocity, -swayRoom, swayRoom);
	state.rollVelocity += state.curveDirection * rollImpulse;
	state.swayVelocity -= state.curveDirection * swayImpulse;
	state.curveInjectedRoll += Math.abs(rollImpulse);
	state.curveInjectedSway += Math.abs(swayImpulse);
}

function motionUpdateCurveEvent(state, filteredDeficit, tickDelta) {
	var direction = Math.abs(filteredDeficit) > 0.0001 ? motionSign(filteredDeficit) : 0;
	var magnitude = Math.abs(filteredDeficit);

	if (!state.curveActive) {
		if (direction == 0 || magnitude < motionConfig.curveEventEnterAcceleration) return;
		state.curveActive = true;
		state.curveDirection = direction;
		state.curveReferenceMagnitude = magnitude;
		state.curveInjectedRoll = 0.0;
		state.curveInjectedSway = 0.0;
		state.curveStageSign = 0;
		state.curveStageTicks = 0;
		state.curveExitTicks = 0;
		motionApplyCurveStage(state, 0.0, magnitude);
	}

	var sameCurve = direction == state.curveDirection &&
		magnitude >= motionConfig.curveEventExitAcceleration;
	if (sameCurve) {
		state.curveExitTicks = 0;
		var stageDelta = magnitude - state.curveReferenceMagnitude;
		if (Math.abs(stageDelta) >= motionConfig.curveEventStageThreshold) {
			var stageSign = motionSign(stageDelta);
			if (state.curveStageSign == stageSign) state.curveStageTicks += tickDelta;
			else {
				state.curveStageSign = stageSign;
				state.curveStageTicks = tickDelta;
			}
			// 曲率差夠大且持續時，才作為同一彎道的新階段反映一次。 / 大きな曲率差が継続した時だけ同一曲線内の次段階として1回反映します。 / Apply one correction only when a significant curvature stage persists.
			if (state.curveStageTicks >= motionConfig.curveEventStageHoldTicks) {
				motionApplyCurveStage(state, state.curveReferenceMagnitude, magnitude);
				state.curveReferenceMagnitude = magnitude;
				state.curveStageSign = 0;
				state.curveStageTicks = 0;
			}
		} else {
			state.curveStageSign = 0;
			state.curveStageTicks = 0;
		}
		return;
	}

	// 反向彎（S 形、渡線）：不等出彎確認，立即結束前彎並以反方向開始新事件；兩次回應同向疊加，形成明快的甩動。 / 反向曲線（S字・渡り線）：退出確認を待たず前の曲線を終了し、逆方向の新イベントを開始します。両応答が同方向に重なり、歯切れよく振られます。 / Reverse (S / crossover) curve: end the previous event without the exit hold and start a new one the other way; both responses add in the same direction for a crisp swing.
	if (direction == -state.curveDirection && magnitude >= motionConfig.curveEventEnterAcceleration) {
		motionEmitCurveExit(state, motionConfig.curveReverseExitFactor);
		motionUpdateCurveEvent(state, filteredDeficit, tickDelta);
		return;
	}

	// 短接縫或緩和曲線的暫時下降仍維持同一事件。 / 短い継目や緩和曲線内の一時低下では同じイベントを維持します。 / Keep one event across short joints or temporary transition-curve dips.
	state.curveExitTicks += tickDelta;
	if (state.curveExitTicks < motionConfig.curveEventExitHoldTicks) return;
	motionEmitCurveExit(state, motionConfig.curveExitFactor);
}

// 出彎只產生一次回應，隨後完整釋放事件狀態。 / 曲線退出応答は1回だけ与え、その後イベント状態を解放します。 / Emit one curve-exit response, then fully release the event state.
function motionEmitCurveExit(state, factor) {
	var exitRatio = motionCurveResponseRatio(state.curveReferenceMagnitude) * factor;
	var exitRollImpulse = exitRatio * motionConfig.curveRollPeakVelocity;
	var exitSwayImpulse = exitRatio * motionConfig.curveSwayPeakVelocity;
	state.rollVelocity -= state.curveDirection * exitRollImpulse;
	state.swayVelocity += state.curveDirection * exitSwayImpulse;
	motionResetCurveEvent(state);
}

function motionReadBogieXZ(entity, index, fallbackX, fallbackZ) {
	var sample = RTMBodyMotionAdapter.readBogie(
		entity, index, fallbackX, RTMBodyMotionAdapter.getY(entity), fallbackZ);
	return {bogie:sample, x:sample.x, z:sample.z};
}

//=============================================================================
// 模組 G：乘客載重懸吊 / モジュールG：乗客荷重サスペンション / MODULE G: PASSENGER-LOAD SUSPENSION
//=============================================================================
var motionLoadUnsupported = false;
var motionLoadFailures = 0;

// 統計本節車上的乘客：橫向偏心、縱向偏心與人數（皆已乘上重量）；平台不支援實體搜尋時回傳 null。 / 本車の乗客を集計：横偏心・縦偏心・人数（重量込み）。実体検索非対応ならnullを返します。 / Tally passengers in this car: lateral and longitudinal moments plus head count (weighted); returns null when entity search is unsupported.
function motionMeasureLoad(entity, x, y, z, yaw) {
	var halfLength = motionConfig.loadHalfLength > 0.0 ? motionConfig.loadHalfLength :
		RTMBodyMotionAdapter.getCarHalfLength(entity, motionConfig.loadFallbackHalfLength);
	var halfWidth = motionConfig.loadHalfWidth;
	var floorY = y + RTMBodyMotionAdapter.getFloorOffset(motionConfig.loadFloorOffsets);
	var reach = halfLength + halfWidth;
	var list = RTMBodyMotionAdapter.getEntitiesAround(entity,
		x - reach, floorY - motionConfig.loadFeetBelow - 2.0, z - reach,
		x + reach, floorY + motionConfig.loadFeetAbove + 2.0, z + reach);
	if (list == null) return null;

	// 車體座標：長度沿 (sinψ, cosψ)，寬度沿模型 +X (cosψ, -sinψ)；與 RTM glRotatef(yaw) 一致。 / 車体座標：長さは(sinψ, cosψ)、幅はモデル+X (cosψ, -sinψ)方向で、RTMのglRotatef(yaw)と一致します。 / Car frame: length along (sinψ, cosψ), width along model +X (cosψ, -sinψ), matching RTM's glRotatef(yaw).
	var frame = {
		x: x, z: z, floorY: floorY, halfLength: halfLength, halfWidth: halfWidth,
		sinYaw: Math.sin(yaw * Math.PI / 180.0), cosYaw: Math.cos(yaw * Math.PI / 180.0)
	};
	var result = {lateral: 0.0, longitudinal: 0.0, count: 0.0, diagnostics: []};
	for (var i = 0; i < list.length; ++i) {
		var other = list[i];
		var kind = RTMBodyMotionAdapter.classifyEntity(other, motionConfig.loadExcludedClasses);
		if (kind == null) continue;
		if (kind == "living" && !motionConfig.loadCountNpcs) continue;
		var hit = motionLocatePassenger(frame, other, kind, false);
		// 乘坐中的乘客：客戶端的乘客座標可能未同步（例如其他玩家坐在座位上），自身位置不在車內時改用座位實體的位置判定。 / 乗車中の乗客：クライアント側の乗客座標が同期されない場合があり（他プレイヤーの着席など）、自身の位置が車外なら座席実体の位置で判定します。 / Riding passengers: client-side rider positions may be stale (e.g. other players seated), so fall back to the seat entity's position when the rider itself appears outside.
		if (!hit.ok) {
			var mount = RTMBodyMotionAdapter.getRidingEntity(other);
			if (mount != null) {
				var seatHit = motionLocatePassenger(frame, mount, kind, true);
				if (seatHit.ok) hit = seatHit;
				else hit.reason += "+seat:" + seatHit.reason;
			}
		}
		if (motionConfig.debugLogLoad && result.diagnostics.length < 8) {
			result.diagnostics.push(RTMBodyMotionAdapter.classNameOf(other).replace(/^.*\./, "") + "(" + kind + ")" +
				" w=" + hit.width.toFixed(2) + " l=" + hit.length.toFixed(2) + " feet=" + hit.feet.toFixed(2) +
				(hit.viaSeat ? " via-seat" : "") + " -> " + (hit.ok ? "counted" : "rejected:" + hit.reason));
		}
		if (!hit.ok) continue;
		var weight = kind == "player" ? 1.0 : motionConfig.loadNpcWeight;
		result.lateral += weight * motionClamp(hit.width / motionConfig.loadReferenceWidth, -1.5, 1.5);
		result.longitudinal += weight * motionClamp(hit.length / halfLength, -1.0, 1.0);
		result.count += weight;
	}
	return result;
}

// 換算到車體座標並判斷是否在車內。車體座標：長度沿 (sinψ, cosψ)，寬度沿模型 +X (cosψ, -sinψ)，與 RTM glRotatef(yaw) 一致。 / 車体座標へ換算し車内か判定します。長さは(sinψ, cosψ)、幅はモデル+X (cosψ, -sinψ)方向で、RTMのglRotatef(yaw)と一致します。 / Convert to the car frame and test whether it is inside. Length runs along (sinψ, cosψ), width along model +X (cosψ, -sinψ), matching RTM's glRotatef(yaw).
function motionLocatePassenger(frame, object, kind, viaSeat) {
	var relX = RTMBodyMotionAdapter.getX(object) - frame.x;
	var relZ = RTMBodyMotionAdapter.getZ(object) - frame.z;
	var hit = {
		ok: false, reason: "", viaSeat: viaSeat,
		length: relX * frame.sinYaw + relZ * frame.cosYaw,
		width: relX * frame.cosYaw - relZ * frame.sinYaw,
		feet: (viaSeat ? RTMBodyMotionAdapter.getY(object) :
			RTMBodyMotionAdapter.getFeetY(object, kind, motionConfig.loadLegacyEyeOffset)) - frame.floorY
	};
	if (Math.abs(hit.length) > frame.halfLength) hit.reason = "length";
	else if (Math.abs(hit.width) > frame.halfWidth) hit.reason = "width";
	else if (hit.feet < -motionConfig.loadFeetBelow || hit.feet > motionConfig.loadFeetAbove) hit.reason = "height";
	else hit.ok = true;
	return hit;
}

// 載重 → 原始姿態：載重側下沉。+X 側較重時車頂倒向 +X（roll 為負）；前方（+Z）較重時車頭下沉（pitch 為正）。 / 荷重→生姿勢：荷重側が沈みます。+X側が重いと車体上部は+Xへ（rollは負）、前方（+Z）が重いと前端が沈みます（pitchは正）。 / Load to raw pose: the loaded side sinks. Heavier +X tilts the roof toward +X (negative roll); heavier front (+Z) dips the nose (positive pitch).
function motionLoadRawPose(measure) {
	return {
		roll: motionClamp(-motionConfig.loadRollPerPerson * measure.lateral,
			-motionConfig.loadMaxRoll, motionConfig.loadMaxRoll),
		pitch: motionClamp(motionConfig.loadPitchPerPerson * measure.longitudinal,
			-motionConfig.loadMaxPitch, motionConfig.loadMaxPitch),
		sink: motionClamp(-motionConfig.loadSinkPerPerson * measure.count,
			-motionConfig.loadMaxSink, 0.0)
	};
}

// 每 Tick 更新：平滑載重輸入，調平閥以 levelingTime 追上，輸出「平滑值－調平值」，因此載重改變時先傾斜，再慢慢回到水平。 / 毎Tick更新：荷重入力を平滑化し、高さ調整弁がlevelingTimeで追従。「平滑値－調整値」を出力するため、荷重変化時はまず傾き、その後ゆっくり水平へ戻ります。 / Per tick: smooth the load, let the leveling valve follow with levelingTime, and output smoothed minus leveled, so a load change tilts first and then settles back to level.
function motionUpdateLoad(state, entity, x, y, z, yaw, dt, resetLeveling) {
	if (!motionConfig.loadEnabled || motionLoadUnsupported) return;
	var measure = motionMeasureLoad(entity, x, y, z, yaw);
	if (measure == null) {
		// 連續失敗才停用，避免世界剛載入時的暫時失敗。 / 連続失敗時のみ無効化し、ワールド読込直後の一時的な失敗を除外します。 / Disable only after consecutive failures to ignore transient errors right after world load.
		if (++motionLoadFailures >= 40) {
			motionLoadUnsupported = true;
			motionLog("MCWrapper.getEntities is unavailable on this platform; passenger-load suspension disabled.");
		}
		return;
	}
	motionLoadFailures = 0;
	// 除錯：每 2 秒列出本節車附近每個候選實體的判定結果（計入或排除理由：length／width／height）。 / デバッグ：2秒ごとに本車付近の各候補の判定結果（計上または除外理由）を出力します。 / Debug: every 2 s list each nearby candidate's verdict (counted, or rejected by length/width/height).
	if (motionConfig.debugLogLoad && measure.diagnostics.length > 0) {
		state.loadDiagTicks = (state.loadDiagTicks || 0) + 1;
		if (state.loadDiagTicks >= 40) {
			state.loadDiagTicks = 0;
			motionLog("load scan car=" + RTMBodyMotionAdapter.getEntityId(entity) + " passengers=" + measure.count.toFixed(1) +
				" | " + measure.diagnostics.join(" | "));
		}
	}
	var raw = motionLoadRawPose(measure);
	if (resetLeveling || !state.loadInitialized) {
		// 初次載入或長時間未描畫時，視為已調平，避免一出現就傾斜。 / 初回読込や長時間未描画時は調整済みとみなし、出現直後の傾きを防ぎます。 / On first load or after a long gap, treat the car as already leveled to avoid an initial tilt.
		state.loadSmoothRoll = state.loadLevelRoll = raw.roll;
		state.loadSmoothPitch = state.loadLevelPitch = raw.pitch;
		state.loadSmoothSink = state.loadLevelSink = raw.sink;
		state.loadPrevCount = measure.count;
		state.loadPrevLateral = measure.lateral;
		state.loadInitialized = true;
		return;
	}

	// 上下車踏步衝擊：人數改變的那一 Tick 才觸發（車內走動不觸發）。上車時橫向載重往該側增加→該側下沉；下車相反→反彈。 / 乗降の踏み込み衝撃：人数が変わったTickだけ発生（車内歩行では発生しない）。乗車でその側の荷重が増え沈み、降車は逆に跳ね返ります。 / Step jolt: fires only on the tick the head count changes (not when walking inside). Boarding adds load on that side so it dips; alighting does the opposite and rebounds.
	var countDelta = measure.count - state.loadPrevCount;
	if (Math.abs(countDelta) >= 0.5) {
		var lateralDelta = motionClamp(measure.lateral - state.loadPrevLateral, -2.0, 2.0);
		state.rollVelocity += -motionConfig.loadKickRollVelocity * lateralDelta;
		state.bounceVelocity += -motionConfig.loadKickSinkVelocity * motionClamp(countDelta, -2.0, 2.0);
		if (motionConfig.debugLogLoad) {
			motionLog("load " + (countDelta > 0 ? "board" : "alight") + " car=" + RTMBodyMotionAdapter.getEntityId(entity) +
				" passengers=" + measure.count.toFixed(1) + " lateral=" + measure.lateral.toFixed(2) +
				" (delta " + lateralDelta.toFixed(2) + ") longitudinal=" + measure.longitudinal.toFixed(2));
		}
	}
	state.loadPrevCount = measure.count;
	state.loadPrevLateral = measure.lateral;

	var smooth = 1.0 - Math.exp(-dt / motionConfig.loadSmoothingTime);
	var level = 1.0 - Math.exp(-dt / motionConfig.loadLevelingTime);
	state.loadSmoothRoll += (raw.roll - state.loadSmoothRoll) * smooth;
	state.loadSmoothPitch += (raw.pitch - state.loadSmoothPitch) * smooth;
	state.loadSmoothSink += (raw.sink - state.loadSmoothSink) * smooth;
	state.loadLevelRoll += (state.loadSmoothRoll - state.loadLevelRoll) * level;
	state.loadLevelPitch += (state.loadSmoothPitch - state.loadLevelPitch) * level;
	state.loadLevelSink += (state.loadSmoothSink - state.loadLevelSink) * level;
}

function motionLoadTargets(state) {
	if (!state.loadInitialized) return {roll: 0.0, pitch: 0.0, sink: 0.0};
	return {
		roll: state.loadSmoothRoll - state.loadLevelRoll,
		pitch: state.loadSmoothPitch - state.loadLevelPitch,
		sink: state.loadSmoothSink - state.loadLevelSink
	};
}

//=============================================================================
// 模組 E：狀態與彈簧演算 / モジュールE：状態とばね演算 / MODULE E: STATE AND SPRING SIMULATION
//=============================================================================
function motionCreateState(entity, tick, x, z, yaw, speed) {
	var direction = 1;
	try { direction = entity.getTrainDirection() == 1 ? -1 : 1; } catch (e) {}
	var bogiePos0 = motionReadBogieXZ(entity, 0, x, z);
	var bogiePos1 = motionReadBogieXZ(entity, 1, x, z);
	// 以實體 ID 作為亂數種子，讓同一編組各車各自晃動且結果可重現。 / エンティティIDを乱数シードにし、同一編成の各車が独立かつ再現可能に揺れます。 / Seed the RNG from the entity ID so cars sway independently and reproducibly.
	var entityId = Math.abs(Math.floor(RTMBodyMotionAdapter.getEntityId(entity)));
	return {
		noiseSeed: (entityId * 7919 + 12345) % 2147483646 + 1,
		straightScale: motionReadStraightScale(entity),
		tickStartNanos: motionNowNanos(),
		lastTick: tick,
		lastSeenTick: tick,
		lastX: x,
		lastZ: z,
		lastYaw: yaw,
		travelSign: direction,
		speed: Math.abs(speed) * direction,
		prevAbsSpeed: Math.abs(speed),
		filteredAccel: 0.0,
		filteredLateral: 0.0,
		curveCandidateSign: 0,
		curveStableTicks: 0,
		curveActive: false,
		curveDirection: 0,
		curveReferenceMagnitude: 0.0,
		curveInjectedRoll: 0.0,
		curveInjectedSway: 0.0,
		curveStageSign: 0,
		curveStageTicks: 0,
		curveExitTicks: 0,
		prevDecel: 0.0,
		brakingPeak: 0.0,
		stopArmed: Math.abs(speed) > 0.25,
		emergencyCooldown: 0,
		roll: 0.0,
		rollVelocity: 0.0,
		sway: 0.0,
		swayVelocity: 0.0,
		pitch: 0.0,
		pitchVelocity: 0.0,
		shift: 0.0,
		shiftVelocity: 0.0,
		stopPitch: 0.0,
		stopPitchVelocity: 0.0,
		stopShift: 0.0,
		stopShiftVelocity: 0.0,
		switchBounce: 0.0,
		switchBounceVelocity: 0.0,
		lastBogie0X: bogiePos0.x,
		lastBogie0Z: bogiePos0.z,
		lastBogie1X: bogiePos1.x,
		lastBogie1Z: bogiePos1.z,
		switchToeCooldown0: 0,
		switchToeCooldown1: 0,
		switchFrogCooldown0: 0,
		switchFrogCooldown1: 0,
		switchToeInside0: false,
		switchToeInside1: false,
		switchFrogInside0: false,
		switchFrogInside1: false,
		bounce: 0.0,
		bounceVelocity: 0.0,
		prevRoll: 0.0,
		prevSway: 0.0,
		prevPitch: 0.0,
		prevShift: 0.0,
		prevStopPitch: 0.0,
		prevStopShift: 0.0,
		prevSwitchBounce: 0.0,
		prevBounce: 0.0,
		prevRollVelocity: 0.0,
		prevSwayVelocity: 0.0,
		prevPitchVelocity: 0.0,
		prevShiftVelocity: 0.0,
		prevStopPitchVelocity: 0.0,
		prevStopShiftVelocity: 0.0,
		prevSwitchBounceVelocity: 0.0,
		prevBounceVelocity: 0.0,
		interpolationDt: 0.05,
		loadInitialized: false,
		loadSmoothRoll: 0.0, loadSmoothPitch: 0.0, loadSmoothSink: 0.0,
		loadLevelRoll: 0.0, loadLevelPitch: 0.0, loadLevelSink: 0.0,
		loadPrevCount: 0.0, loadPrevLateral: 0.0
	};
}

function motionSpring(value, velocity, target, frequency, damping, dt, limit) {
	var omega = Math.PI * 2.0 * frequency;
	var steps = Math.max(1, Math.ceil(dt / motionConfig.springMaxStep));
	var stepTime = dt / steps;
	for (var i = 0; i < steps; ++i) {
		var acceleration = (target - value) * omega * omega - velocity * (2.0 * damping * omega);
		velocity += acceleration * stepTime;
		value += velocity * stepTime;
	}
	if (value > limit) {
		value = limit;
		if (velocity > 0.0) velocity = 0.0;
	} else if (value < -limit) {
		value = -limit;
		if (velocity < 0.0) velocity = 0.0;
	}
	return [value, velocity];
}

function motionCleanup(tick) {
	if (motionLastCleanupTick >= 0 && tick - motionLastCleanupTick < 200) return;
	motionLastCleanupTick = tick;
	for (var key in motionStates) {
		if (motionStates.hasOwnProperty(key) && tick - motionStates[key].lastSeenTick > 400) {
			delete motionStates[key];
		}
	}
}

function motionUpdate(entity) {
	motionEnsureConfig();
	var tick = motionGetTick(entity);
	var wallTick = motionWallTick();
	var id = "e" + RTMBodyMotionAdapter.getEntityId(entity);
	var x = RTMBodyMotionAdapter.getX(entity);
	var z = RTMBodyMotionAdapter.getZ(entity);
	var yaw = RTMBodyMotionAdapter.getYaw(entity);
	var y = RTMBodyMotionAdapter.getY(entity);
	// RTM 原始速度 ×72 為 km/h；除以 3.6 等同 ×20，供物理演算使用 m/s。 / RTM生速度×72がkm/hで、3.6で割ると×20となり物理演算用m/sになります。 / Raw RTM speed ×72 is km/h; dividing by 3.6 equals ×20 for physics in m/s.
	var rtmSpeed = RTMBodyMotionAdapter.getSpeedMps(entity);
	var state = motionStates[id];

	if (!state) {
		state = motionCreateState(entity, tick, x, z, yaw, rtmSpeed);
		state.lastSeenTick = wallTick;
		motionStates[id] = state;
		return state;
	}

	state.lastSeenTick = wallTick;
	if (tick == state.lastTick) return state; // 普通・半透明・発光Passで重複演算しない

	var tickDelta = tick - state.lastTick;
	if (tickDelta <= 0 || tickDelta > 5) {
		// 時間倒退、解除暫停或久未描畫時只重設微分輸入。 / 時刻巻戻り・ポーズ解除・長時間未描画時は微分入力だけ再初期化します。 / Reset derivative inputs only after time rollback, unpausing, or a long render gap.
		state.lastTick = tick;
		state.lastX = x;
		state.lastZ = z;
		state.lastYaw = yaw;
		state.speed = Math.abs(rtmSpeed) * state.travelSign;
		state.filteredAccel = 0.0;
		state.filteredLateral = 0.0;
		state.curveCandidateSign = 0;
		state.curveStableTicks = 0;
		motionResetCurveEvent(state);
		state.prevDecel = 0.0;
		state.brakingPeak = 0.0;
		state.stopArmed = Math.abs(rtmSpeed) > 0.25;
		var resetBogie0 = motionReadBogieXZ(entity, 0, x, z);
		var resetBogie1 = motionReadBogieXZ(entity, 1, x, z);
		state.lastBogie0X = resetBogie0.x;
		state.lastBogie0Z = resetBogie0.z;
		state.lastBogie1X = resetBogie1.x;
		state.lastBogie1Z = resetBogie1.z;
		state.switchToeInside0 = false;
		state.switchToeInside1 = false;
		state.switchFrogInside0 = false;
		state.switchFrogInside1 = false;
		state.loadInitialized = false;
		state.tickStartNanos = motionNowNanos();
		return state;
	}
	state.tickStartNanos = motionNowNanos();

	var dt = tickDelta * 0.05;
	var dx = x - state.lastX;
	var dz = z - state.lastZ;
	var moved = Math.sqrt(dx * dx + dz * dz);
	var yawDelta = motionWrapAngle(yaw - state.lastYaw);
	var expectedMove = Math.abs(rtmSpeed) * dt * 3.0 + 3.0;
	var badSample = moved > expectedMove || Math.abs(yawDelta) > 45.0;

	// 以 rotationYaw=0 的局部 +Z 為基準，由實際位移決定方向。 / rotationYaw=0のローカル+Z基準で実移動から進行方向を決めます。 / Determine travel direction from actual motion relative to local +Z at yaw zero.
	var yawRad = yaw * Math.PI / 180.0;
	var projectedMove = dx * Math.sin(yawRad) + dz * Math.cos(yawRad);
	if (!badSample && Math.abs(projectedMove) > 0.0005) {
		state.travelSign = motionSign(projectedMove);
	}
	var signedSpeed = Math.abs(rtmSpeed) * state.travelSign;
	var absSpeed = Math.abs(signedSpeed);

	var yawRate = 0.0;
	if (!badSample && absSpeed > 0.20) {
		yawRate = yawDelta * Math.PI / 180.0 / dt;
		yawRate = motionClamp(yawRate, -0.80, 0.80);
	}

	// 曲率 k=yawRate/speed，橫向加速度 v^2*k 等於 v*yawRate。 / 曲率k=yawRate/speed、横加速度v^2*kはv*yawRateと等価です。 / Curvature k=yawRate/speed, and lateral acceleration v^2*k equals v*yawRate.
	// 符號＝離心力方向：RTM 以 glRotatef(yaw, 0,1,0) 描畫，Yaw 增加時彎心在模型 +X 側，離心力朝 -X；
	// 正值經 glRotated(roll, 0,0,1) 使車頂倒向 -X，glTranslated(-sway) 亦朝 -X，因此車體朝彎道外側晃動。倒退行駛時兩者同時反號，結論不變。 /
	// 符号＝遠心力方向：RTMはglRotatef(yaw, 0,1,0)で描画し、Yaw増加時の曲線中心はモデル+X側、遠心力は-X側です。正値でglRotated(roll, 0,0,1)により車体上部が-Xへ傾き、横変位も-Xへ向かうため、車体は曲線外側へ揺れます。後退時も両者が同時に反転し結論は同じです。 /
	// Sign = centrifugal direction: RTM renders with glRotatef(yaw, 0,1,0), so increasing yaw puts the curve center on model +X and centrifugal force on -X;
	// a positive value tilts the roof toward -X via glRotated(roll, 0,0,1) and shifts sway toward -X, so the body swings outward. Reversing flips both signs, so the result holds.
	var lateralAcceleration = signedSpeed * yawRate;
	// 本 tick 只讀一次前後轉向架，超高與道岔偵測共用（原本兩處各讀一次，參數與時點相同，結果不變）。 / 本tickで前後台車を一度だけ読み、カントと分岐器検出で共用します（従来は2箇所で同条件のまま各1回読込、結果は同じ）。 / Read both bogies once per tick and share them between cant and turnout detection (previously read twice with identical arguments and timing; results unchanged).
	var currentBogie0 = motionReadBogieXZ(entity, 0, x, z);
	var currentBogie1 = motionReadBogieXZ(entity, 1, x, z);
	var cantDegrees = RTMBodyMotionAdapter.readCantFromSamples(entity, [currentBogie0.bogie, currentBogie1.bogie]);
	var curvature = absSpeed > 0.20 ? Math.abs(yawRate / signedSpeed) : 0.0;
	var curveRadius = curvature > 0.000001 ? 1.0 / curvature : 1000000000.0;
	var speedKmh = absSpeed * 3.6;
	// 採國土交通省標準式 C=G*V^2/(127*R)，G=1067 mm。 / 国土交通省標準式C=G*V^2/(127*R)、G=1067 mmを使用します。 / Use the MLIT standard formula C=G*V^2/(127*R), with G=1067 mm.
	var equilibriumCantMm = motionConfig.gaugeMm * speedKmh * speedKmh /
		(127.0 * curveRadius);
	var actualCantMm = motionConfig.gaugeMm *
		Math.tan(Math.abs(cantDegrees) * Math.PI / 180.0);
	var cantDeficiencyMm = Math.max(0.0, equilibriumCantMm - actualCantMm);
	var curveDeficit = 0.0;
	if (absSpeed >= motionConfig.curveMinSpeed &&
		cantDeficiencyMm >= motionConfig.curveMinDeficiencyMm) {
		// 將超高不足換回橫向加速度：alpha=g*Cd/G。 / カント不足を横加速度へ戻します：alpha=g*Cd/G。 / Convert cant deficiency back to lateral acceleration: alpha=g*Cd/G.
		curveDeficit = motionSign(lateralAcceleration) * motionConfig.gravity *
			cantDeficiencyMm / motionConfig.gaugeMm;
	}
	curveDeficit = motionClamp(curveDeficit, -3.0, 3.0);
	// 真實彎道會維持旋回方向；單 Tick 反轉視為 Yaw 量化雜訊。 / 真の曲線は旋回方向が継続するため、1 Tick反転はYaw量子化ノイズとして除外します。 / A real curve keeps one turning direction; reject one-tick reversals as yaw quantization noise.
	var curveDeficitSign = Math.abs(curveDeficit) > 0.0001 ? motionSign(curveDeficit) : 0;
	if (curveDeficitSign == 0) {
		state.curveCandidateSign = 0;
		state.curveStableTicks = 0;
	} else if (state.curveCandidateSign == curveDeficitSign) {
		state.curveStableTicks += tickDelta;
	} else {
		state.curveCandidateSign = curveDeficitSign;
		state.curveStableTicks = tickDelta;
	}
	if (state.curveStableTicks < 2) curveDeficit = 0.0;
	var lateralFilter = motionClamp(dt * motionConfig.curveInputFilterRate, 0.0, 1.0);
	state.filteredLateral += (curveDeficit - state.filteredLateral) * lateralFilter;

	var rawAcceleration = (signedSpeed - state.speed) / dt;
	rawAcceleration = badSample ? 0.0 : motionClamp(rawAcceleration, -3.5, 3.5);
	var accelFilter = motionClamp(dt * 5.0, 0.0, 1.0);
	state.filteredAccel += (rawAcceleration - state.filteredAccel) * accelFilter;
	var deceleration = Math.max(0.0, -state.filteredAccel * state.travelSign);
	var brakeJerk = (deceleration - state.prevDecel) / dt;
	if (!state.stopArmed && absSpeed > 0.25) {
		state.stopArmed = true;
		state.brakingPeak = 0.0;
	}
	if (state.stopArmed && deceleration > state.brakingPeak) {
		state.brakingPeak = deceleration;
	}

	state.prevRoll = state.roll;
	state.prevSway = state.sway;
	state.prevPitch = state.pitch;
	state.prevShift = state.shift;
	state.prevStopPitch = state.stopPitch;
	state.prevStopShift = state.stopShift;
	state.prevSwitchBounce = state.switchBounce;
	state.prevBounce = state.bounce;
	state.prevRollVelocity = state.rollVelocity;
	state.prevSwayVelocity = state.swayVelocity;
	state.prevPitchVelocity = state.pitchVelocity;
	state.prevShiftVelocity = state.shiftVelocity;
	state.prevStopPitchVelocity = state.stopPitchVelocity;
	state.prevStopShiftVelocity = state.stopShiftVelocity;
	state.prevSwitchBounceVelocity = state.switchBounceVelocity;
	state.prevBounceVelocity = state.bounceVelocity;
	state.interpolationDt = dt;

	if (state.emergencyCooldown > 0) state.emergencyCooldown -= tickDelta;
	if (deceleration > motionConfig.emergencyDecel &&
		brakeJerk > motionConfig.emergencyJerk &&
		state.emergencyCooldown <= 0) {
		state.stopPitchVelocity += state.travelSign * motionConfig.emergencyPitchImpulse;
		state.shiftVelocity += state.travelSign * motionConfig.emergencyShiftImpulse;
		state.emergencyCooldown = 20;
	}

	// 尖軌與轍叉獨立判定及冷卻，避免前段小衝擊遮蔽後段大衝擊。 / トングとクロッシングを独立判定・冷却し、前段の小衝撃が後段の大衝撃を消さないようにします。 / Detect and cool down toe and frog independently so the smaller first impact cannot suppress the larger one.
	state.switchToeCooldown0 = Math.max(0, state.switchToeCooldown0 - tickDelta);
	state.switchToeCooldown1 = Math.max(0, state.switchToeCooldown1 - tickDelta);
	state.switchFrogCooldown0 = Math.max(0, state.switchFrogCooldown0 - tickDelta);
	state.switchFrogCooldown1 = Math.max(0, state.switchFrogCooldown1 - tickDelta);
	if (!badSample && absSpeed > 0.10) {
		var switchSpeedRatio = speedKmh / motionConfig.switchSpeedFalloffKmh;
		var switchSpeedFactor = motionConfig.switchMinSpeedFactor +
			(1.0 - motionConfig.switchMinSpeedFactor) /
			(1.0 + switchSpeedRatio * switchSpeedRatio);
		var triggerRadiusSq = motionConfig.switchTriggerRadius * motionConfig.switchTriggerRadius;
		for (var switchBogie = 0; switchBogie < 2; ++switchBogie) {
			var currentBogie = switchBogie == 0 ? currentBogie0 : currentBogie1;
			var lastBogieX = switchBogie == 0 ? state.lastBogie0X : state.lastBogie1X;
			var lastBogieZ = switchBogie == 0 ? state.lastBogie0Z : state.lastBogie1Z;
			var impactDistancesSq = motionGetSwitchImpactDistancesSq(
				currentBogie.bogie, lastBogieX, lastBogieZ, currentBogie.x, currentBogie.z);
			var switchDirection = Math.abs(lateralAcceleration) > 0.01 ?
				motionSign(lateralAcceleration) :
				(((RTMBodyMotionAdapter.getEntityId(entity) + switchBogie) & 1) == 0 ? 1.0 : -1.0);

			var insideToe = impactDistancesSq.toe <= triggerRadiusSq;
			var wasInsideToe = switchBogie == 0 ? state.switchToeInside0 : state.switchToeInside1;
			var toeCooldown = switchBogie == 0 ? state.switchToeCooldown0 : state.switchToeCooldown1;
			if (insideToe && !wasInsideToe && toeCooldown <= 0) {
				motionApplySwitchImpulse(state, "toe", switchDirection, switchSpeedFactor);
				if (switchBogie == 0) state.switchToeCooldown0 = motionConfig.switchToeCooldownTicks;
				else state.switchToeCooldown1 = motionConfig.switchToeCooldownTicks;
			}

			var insideFrog = impactDistancesSq.frog <= triggerRadiusSq;
			var wasInsideFrog = switchBogie == 0 ? state.switchFrogInside0 : state.switchFrogInside1;
			var frogCooldown = switchBogie == 0 ? state.switchFrogCooldown0 : state.switchFrogCooldown1;
			if (insideFrog && !wasInsideFrog && frogCooldown <= 0) {
				motionApplySwitchImpulse(state, "frog", switchDirection, switchSpeedFactor);
				if (switchBogie == 0) state.switchFrogCooldown0 = motionConfig.switchFrogCooldownTicks;
				else state.switchFrogCooldown1 = motionConfig.switchFrogCooldownTicks;
			}

			if (switchBogie == 0) {
				state.switchToeInside0 = insideToe;
				state.switchFrogInside0 = insideFrog;
			} else {
				state.switchToeInside1 = insideToe;
				state.switchFrogInside1 = insideFrog;
			}
		}
	}
	state.lastBogie0X = currentBogie0.x;
	state.lastBogie0Z = currentBogie0.z;
	state.lastBogie1X = currentBogie1.x;
	state.lastBogie1Z = currentBogie1.z;

	// 將多段軌道與緩和曲線整合成一個事件，避免每個接縫重複激振。 / 多段軌道と緩和曲線を1イベントに統合し、継目ごとの再激振を防ぎます。 / Merge segmented and transition curves into one event to prevent re-excitation at every joint.
	motionUpdateCurveEvent(state, state.filteredLateral, tickDelta);

	// 保留近期制動峰值，在真正停止時觸發；不只查看前一 Tick。 / 直前Tickだけでなく制動ピークを保持し、実停止時に衝動を出します。 / Retain the braking peak and trigger at the actual stop instead of checking only the previous tick.
	if (state.stopArmed && absSpeed < 0.06) {
		var stopBrakeLevel = motionReadBrakeLevel(entity);
		if (stopBrakeLevel >= motionConfig.stopMinBrakeLevel &&
			state.brakingPeak >= motionConfig.stopDecel) {
			var stopStrength = motionClamp(
				(state.brakingPeak - motionConfig.stopDecel) / 1.50,
				0.0,
				1.0
			);
			var notchFactor = motionConfig.stopNotchFactors[stopBrakeLevel];
			state.stopPitchVelocity += state.travelSign *
				motionConfig.stopPitchImpulse * notchFactor * (1.0 + stopStrength * 0.15);
			state.stopShiftVelocity += state.travelSign *
				motionConfig.stopShiftImpulse * notchFactor * (1.0 + stopStrength * 0.10);
		}
		state.stopArmed = false;
		state.brakingPeak = 0.0;
	}

	// 直線軌道不整：隨機激振車體彈簧；DataMap 倍率平滑過渡。 / 直線軌道狂い：車体ばねをランダム加振し、DataMap倍率は滑らかに遷移します。 / Straight-track irregularity: randomly excite the body springs; the DataMap scale changes smoothly.
	var straightScaleFilter = motionClamp(dt * motionConfig.straightScaleFilter, 0.0, 1.0);
	state.straightScale += (motionReadStraightScale(entity) - state.straightScale) * straightScaleFilter;
	if (!badSample) motionApplyStraightExcitation(state, speedKmh, dt);

	// 彎道持續外傾：彈簧目標隨超高不足（飽和）移動，進彎過衝、出彎反彈都由彈簧自然產生。 / 曲線の持続外傾：ばね目標がカント不足（飽和）に追従し、進入の行き過ぎと退出の揺り戻しはばねが自然に生みます。 / Sustained curve lean: the spring target follows saturated cant deficiency, so entry overshoot and exit rebound arise naturally.
	var leanRatio = motionSign(state.filteredLateral) * motionCurveResponseRatio(state.filteredLateral);
	var targetRoll = leanRatio * motionConfig.curveLeanRoll;
	var targetSway = -leanRatio * motionConfig.curveLeanSway;
	// 電車一般加減速不套用汽車式抬頭／低頭。 / 電車の通常加減速には自動車式のピッチを加えません。 / Normal train acceleration does not use car-like pitch motion.
	// Pitch 與前後位移只供急制動及停車衝動使用。 / ピッチと前後変位は急制動・停止衝動専用です。 / Pitch and longitudinal shift are reserved for emergency braking and stop shock.
	var targetPitch = 0.0;
	var targetShift = 0.0;
	var targetBounce = 0.0;

	// 乘客載重：上下車造成的傾斜疊加在彈簧目標上，由調平閥慢慢回正。 / 乗客荷重：乗降による傾きをばね目標に重ね、高さ調整弁でゆっくり戻します。 / Passenger load: boarding/alighting tilt is added to the spring targets and leveled back slowly.
	motionUpdateLoad(state, entity, x, y, z, yaw, dt, false);
	var loadTargets = motionLoadTargets(state);
	targetRoll += loadTargets.roll;
	targetPitch += loadTargets.pitch;
	targetBounce += loadTargets.sink;

	var result = motionSpring(state.roll, state.rollVelocity, targetRoll,
		motionConfig.bodyRollFrequency, motionConfig.bodyRollDamping, dt, motionConfig.maxRoll);
	state.roll = result[0]; state.rollVelocity = result[1];
	result = motionSpring(state.sway, state.swayVelocity, targetSway,
		motionConfig.bodySwayFrequency, motionConfig.bodySwayDamping, dt, motionConfig.maxSway);
	state.sway = result[0]; state.swayVelocity = result[1];
	result = motionSpring(state.pitch, state.pitchVelocity, targetPitch, 0.92, 0.58, dt, motionConfig.maxPitch);
	state.pitch = result[0]; state.pitchVelocity = result[1];
	result = motionSpring(state.shift, state.shiftVelocity, targetShift, 1.00, 0.62, dt, motionConfig.maxShift);
	state.shift = result[0]; state.shiftVelocity = result[1];
	result = motionSpring(state.stopPitch, state.stopPitchVelocity, 0.0,
		motionConfig.stopPitchFrequency, motionConfig.stopPitchDamping, dt, 0.35);
	state.stopPitch = result[0]; state.stopPitchVelocity = result[1];
	result = motionSpring(state.stopShift, state.stopShiftVelocity, 0.0,
		motionConfig.stopShiftFrequency, motionConfig.stopShiftDamping, dt, 0.025);
	state.stopShift = result[0]; state.stopShiftVelocity = result[1];
	result = motionSpring(state.switchBounce, state.switchBounceVelocity, 0.0,
		motionConfig.switchBounceFrequency, motionConfig.switchBounceDamping, dt, 0.012);
	state.switchBounce = result[0]; state.switchBounceVelocity = result[1];
	result = motionSpring(state.bounce, state.bounceVelocity, targetBounce,
		motionConfig.bodyBounceFrequency, motionConfig.bodyBounceDamping, dt, motionConfig.maxBounce);
	state.bounce = result[0]; state.bounceVelocity = result[1];

	state.lastTick = tick;
	state.lastX = x;
	state.lastZ = z;
	state.lastYaw = yaw;
	state.speed = signedSpeed;
	state.prevAbsSpeed = absSpeed;
	state.prevDecel = deceleration;
	motionCleanup(wallTick);
	return state;
}

//=============================================================================
// 模組 F：幀間插值與描畫輸出 / モジュールF：フレーム補間と描画出力 / MODULE F: FRAME INTERPOLATION AND RENDER OUTPUT
//=============================================================================
function motionGetPose(entity, partialTick) {
	motionEnsureConfig();
	if (entity == null) return {roll:0.0, sway:0.0, pitch:0.0, shift:0.0, bounce:0.0};
	var state = motionUpdate(entity);
	var alpha = motionResolveAlpha(state, RTMBodyMotionAdapter.normalizePartialTick(partialTick));
	// 普通、透明與發光 Pass 在同一描畫時刻共用姿勢。 / 通常・透明・発光Passは同じ描画時刻の姿勢を共有します。 / Normal, alpha, and emissive passes share one pose at the same render time.
	if (state.renderPoseTick == state.lastTick &&
		Math.abs(state.renderPoseAlpha - alpha) < 0.0000001 && state.renderPose) {
		return state.renderPose;
	}
	var interpolatedStopPitch = motionHermite(state.prevStopPitch, state.prevStopPitchVelocity,
		state.stopPitch, state.stopPitchVelocity, alpha, state.interpolationDt);
	var interpolatedStopShift = motionHermite(state.prevStopShift, state.prevStopShiftVelocity,
		state.stopShift, state.stopShiftVelocity, alpha, state.interpolationDt);
	var interpolatedSwitchBounce = motionHermite(state.prevSwitchBounce, state.prevSwitchBounceVelocity,
		state.switchBounce, state.switchBounceVelocity, alpha, state.interpolationDt);
	var pose = {
		roll: motionSoftLimit(motionHermite(state.prevRoll, state.prevRollVelocity, state.roll, state.rollVelocity, alpha, state.interpolationDt), motionConfig.maxRoll),
		sway: motionSoftLimit(motionHermite(state.prevSway, state.prevSwayVelocity, state.sway, state.swayVelocity, alpha, state.interpolationDt), motionConfig.maxSway),
		pitch: motionSoftLimit(motionHermite(state.prevPitch, state.prevPitchVelocity, state.pitch, state.pitchVelocity, alpha, state.interpolationDt) + interpolatedStopPitch, motionConfig.maxPitch),
		shift: motionSoftLimit(motionHermite(state.prevShift, state.prevShiftVelocity, state.shift, state.shiftVelocity, alpha, state.interpolationDt) + interpolatedStopShift, motionConfig.maxShift),
		bounce: motionSoftLimit(motionHermite(state.prevBounce, state.prevBounceVelocity, state.bounce, state.bounceVelocity, alpha, state.interpolationDt) + interpolatedSwitchBounce, motionConfig.maxBounce)
	};
	state.renderPoseTick = state.lastTick;
	state.renderPoseAlpha = alpha;
	state.renderPose = pose;
	return pose;
}

//=============================================================================
// partialTick 檢查與時鐘回退 / partialTick検査と時計フォールバック / PARTIAL-TICK PROBE AND CLOCK FALLBACK
//=============================================================================
var motionPartialProbe = {
	frames: 0, zeroFrames: 0, ticks: 0, lastTick: -1, lastFrameNanos: 0,
	minAlpha: 1.0, maxAlpha: 0.0, useClock: false,
	phaseSum: 0.0, phaseCount: 0
};

function motionNowNanos() {
	try { return Number(java.lang.System.nanoTime()); } catch (e) {}
	return new Date().getTime() * 1000000.0;
}

function motionLog(message) {
	try { NGTLog.debug("[BodyMotion] " + message); return; } catch (e1) {}
	try { java.lang.System.out.println("[BodyMotion] " + message); } catch (e2) {}
}

// 統計實際收到的 partialTick；若每 Tick 有多幀卻一直是 0，表示插值失效，改以系統時鐘推算。 / 受け取ったpartialTickを統計し、1Tickに複数フレームあるのに常に0なら補間不能とみなし、システム時計で推定します。 / Track received partialTick; if it stays 0 across multiple frames per tick, interpolation is broken, so estimate it from the system clock.
function motionResolveAlpha(state, rawAlpha) {
	var probe = motionPartialProbe;
	var now = motionNowNanos();
	// 2 ms 內的呼叫視為同一幀（多輛車、多 Pass）。 / 2 ms以内の呼び出しは同一フレーム（複数車両・複数Pass）とみなします。 / Calls within 2 ms count as one frame (multiple cars and passes).
	if (now - probe.lastFrameNanos > 2000000.0 || now < probe.lastFrameNanos) {
		probe.lastFrameNanos = now;
		probe.frames++;
		if (rawAlpha <= 0.0) probe.zeroFrames++;
		probe.minAlpha = Math.min(probe.minAlpha, rawAlpha);
		probe.maxAlpha = Math.max(probe.maxAlpha, rawAlpha);
	}
	// tick 相位：列車進入新 tick 後第一幀收到的 partialTick。時間基準與 RTM 同步時接近 0；不同步時隨機分布、平均約 0.5。 / tick位相：列車が新しいtickに入った最初のフレームのpartialTick。時間基準がRTMと同期していれば0付近、非同期なら平均約0.5に散らばります。 / Tick phase: the partialTick seen on a train's first frame of a new tick. Near 0 when the state clock matches RTM; scattered around 0.5 when it does not.
	if (state.phaseTick !== state.lastTick) {
		state.phaseTick = state.lastTick;
		probe.phaseSum += rawAlpha;
		probe.phaseCount++;
	}
	var wallTick = Math.floor(now / 50000000.0);
	if (wallTick != probe.lastTick) {
		probe.lastTick = wallTick;
		probe.ticks++;
		if (probe.ticks >= motionConfig.partialTickProbeTicks) {
			var framesPerTick = probe.frames / probe.ticks;
			var stuck = framesPerTick > 1.5 && probe.zeroFrames >= probe.frames;
			if (stuck != probe.useClock) {
				probe.useClock = stuck;
				motionLog(stuck ?
					"partialTick stays 0 (" + framesPerTick.toFixed(2) + " frames/tick); switching to clock interpolation." :
					"partialTick is varying again; using RTM partialTick.");
			}
			if (motionConfig.debugLogPartialTick) {
				motionLog("partialTick min=" + probe.minAlpha.toFixed(3) + " max=" + probe.maxAlpha.toFixed(3) +
					" frames/tick=" + framesPerTick.toFixed(2) + " zeroFrames=" + probe.zeroFrames + "/" + probe.frames +
					" mode=" + (probe.useClock ? "clock" : "rtm") + " tickSource=" + motionTickSource +
					" tickPhase=" + (probe.phaseCount > 0 ? (probe.phaseSum / probe.phaseCount).toFixed(3) : "n/a"));
			}
			probe.frames = 0; probe.zeroFrames = 0; probe.ticks = 0;
			probe.phaseSum = 0.0; probe.phaseCount = 0;
			probe.minAlpha = 1.0; probe.maxAlpha = 0.0;
		}
	}
	if (!probe.useClock) return rawAlpha;
	return motionClamp((now - state.tickStartNanos) / 50000000.0, 0.0, 1.0);
}

function motionHermite(value0, velocity0, value1, velocity1, alpha, dt) {
	var t2 = alpha * alpha;
	var t3 = t2 * alpha;
	var h00 = 2.0 * t3 - 3.0 * t2 + 1.0;
	var h10 = t3 - 2.0 * t2 + alpha;
	var h01 = -2.0 * t3 + 3.0 * t2;
	var h11 = t3 - t2;
	return h00 * value0 + h10 * velocity0 * dt +
		h01 * value1 + h11 * velocity1 * dt;
}

function motionApplyPose(entity, partialTick) {
	motionEnsureConfig();
	var pose = motionGetPose(entity, partialTick);
	var test = motionTuning.debug.renderTest;
	if (test == 1) return;
	if (test != 3) GL11.glTranslated(pose.sway, pose.bounce, pose.shift);
	if (test == 2) return;
	GL11.glTranslated(0.0, motionConfig.pivotY, 0.0);
	GL11.glRotated(pose.roll, 0.0, 0.0, 1.0);
	GL11.glRotated(pose.pitch, 1.0, 0.0, 0.0);
	GL11.glTranslated(0.0, -motionConfig.pivotY, 0.0);
}

//=============================================================================
// 模組入口：供主描畫流程使用 / モジュール入口：主描画処理用 / MODULE FACADE: USED BY THE MAIN RENDER PATH
//=============================================================================
// 保留具名函數以相容舊版 Nashorn；此物件只負責清楚分組，不改變演算法。 / 旧Nashorn互換のため名前付き関数を維持し、このオブジェクトは分類だけを行いアルゴリズムを変更しません。 / Named functions remain for legacy Nashorn compatibility; this object only groups them and does not alter behavior.
var MotionModules = {
	math: {
		clamp: motionClamp,
		sign: motionSign,
		softLimit: motionSoftLimit,
		wrapAngle: motionWrapAngle,
		spring: motionSpring,
		hermite: motionHermite,
		tanh: motionTanh,
		peakToVelocity: motionPeakToVelocity,
		noiseForStd: motionNoiseForStd,
		gaussian: motionGaussian
	},
	track: {
		readCant: motionReadCant,
		readBrakeLevel: motionReadBrakeLevel,
		readStraightScale: motionReadStraightScale,
		readBogieXZ: motionReadBogieXZ,
		getSwitchCore: motionGetSwitchCore,
		getSwitchImpactDistancesSq: motionGetSwitchImpactDistancesSq
	},
	turnout: {
		applyImpact: motionApplySwitchImpulse
	},
	curve: {
		resetEvent: motionResetCurveEvent,
		updateEvent: motionUpdateCurveEvent,
		applyStage: motionApplyCurveStage,
		emitExit: motionEmitCurveExit,
		responseRatio: motionCurveResponseRatio
	},
	straight: {
		speedFactor: motionStraightSpeedFactor,
		applyExcitation: motionApplyStraightExcitation
	},
	load: {
		measure: motionMeasureLoad,
		rawPose: motionLoadRawPose,
		update: motionUpdateLoad,
		targets: motionLoadTargets
	},
	engine: {
		createState: motionCreateState,
		update: motionUpdate,
		getPose: motionGetPose,
		resolveAlpha: motionResolveAlpha,
		applyPose: motionApplyPose
	}
};

//=============================================================================
// 公開 API：車輛描畫腳本只需使用這些函式 / 公開API：車両描画スクリプトはこれらの関数だけ使えば十分です / PUBLIC API: vehicle render scripts only need these
//=============================================================================
var RTMBodyMotion = {
	// 模組版本 / モジュールのバージョン / Module version.
	version: "1.0",
	// 在 glPushMatrix() 之後、描畫車體零件之前呼叫；轉向架由 RTM 另外描畫，不受影響。 / glPushMatrix()の後、車体部品を描画する前に呼びます。台車はRTMが別に描画するため影響しません。 / Call after glPushMatrix() and before rendering body parts; bogies are rendered separately by RTM and are unaffected.
	applyPose: function (entity, partialTick) { motionApplyPose(entity, partialTick); },
	// 取得目前姿態 {roll, sway, pitch, shift, bounce}（角度為度、位移為公尺）。 / 現在の姿勢{roll, sway, pitch, shift, bounce}（角度は度、変位はm）を取得します。 / Get the current pose {roll, sway, pitch, shift, bounce} (angles in degrees, offsets in metres).
	getPose: function (entity, partialTick) { return motionGetPose(entity, partialTick); },
	// 發光 Pass 前後呼叫：深度往前推一點並關閉深度寫入，避免發光貼圖與一般貼圖在同一面競爭深度。 / 発光Passの前後で呼びます。深度をわずかに手前へ寄せ深度書込を止め、発光テクスチャと通常テクスチャの深度競合を防ぎます。 / Call around the emissive pass: nudges depth forward and disables depth writes so emissive and normal textures on the same face do not z-fight.
	beginEmissivePass: function () {
		motionEnsureConfig();
		var active = motionTuning.debug.renderTest != 4;
		if (active) {
			GL11.glEnable(GL11.GL_POLYGON_OFFSET_FILL);
			GL11.glPolygonOffset(-1.0, -1.0);
			GL11.glDepthMask(false);
		}
		return active;
	},
	endEmissivePass: function (active) {
		if (!active) return;
		GL11.glDepthMask(true);
		GL11.glPolygonOffset(0.0, 0.0);
		GL11.glDisable(GL11.GL_POLYGON_OFFSET_FILL);
	},
	// 合併後的調校值與內部設定（參考用）。 / マージ後の調整値と内部設定（参照用）。 / Merged tuning and internal config (for reference).
	getTuning: function () { motionEnsureConfig(); return motionTuning; },
	getConfig: function () { motionEnsureConfig(); return motionConfig; },
	modules: MotionModules
};
