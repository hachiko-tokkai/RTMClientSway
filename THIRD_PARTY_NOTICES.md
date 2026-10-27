# RTMBodyMotion

帝立車両様・かんつき様制作の動揺JS（RTMBodyMotion）を使用しています。分岐の形状計算、トング・クロッシング判定、衝撃の方向・強さの処理をJavaへ移植しています。曲線のカント不足入力・方向安定判定・複合曲線イベントもJavaへ移植しています。走行・制動の動揺設計も参考にしています。

対象：SwayHook.javaの分岐処理、Motion.javaの分岐衝撃処理、Curve.javaのカント不足入力・複合曲線イベント。tools/reference/RTMBodyMotion.jsは検証用の原文で、配布JARには含めません。

参照元：https://github.com/C-TREC/RTMBodyMotion

参照コミット：4790b6a49f5a24d64a9c3f850a8c52db5b7a66ab

以下の利用条件は参考元に由来する部分へ適用されます。使用条件の指定クレジットは、参考元の原文表記を保持しています。

1. 本モジュール（RTMBodyMotion.js、RTMBodyMotionAdapter.js および同梱サンプル）は、自由に使用・改変・再配布できます。自作の車両パックに同梱して配布することも可能です。
2. 使用条件：本モジュール（改変版を含む）を使用する車両は、その車両のreadmeに「C-TREC & 月島重工 制作の動揺JSを使用」と明記してください。
3. 本モジュールは現状のまま提供され、制作者は使用結果について一切の保証・責任を負いません。

原文：https://github.com/C-TREC/RTMBodyMotion/blob/4790b6a49f5a24d64a9c3f850a8c52db5b7a66ab/ライセンス_License.txt
