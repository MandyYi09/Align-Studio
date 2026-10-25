import assert from 'node:assert/strict';
import { t, poseSearchText } from '../src/i18n.mjs';
import { poses } from '../src/exercises.mjs';
import { guidanceMessages } from '../src/camera-guidance.mjs';

for (const pose of poses) {
    for (const source of [pose.name, pose.description, pose.area, ...pose.cues]) {
        assert.notEqual(t(source, 'zh'), source, `Missing translation: ${source}`);
        assert.equal(t(source, 'en'), source);
    }
    assert.ok(poseSearchText(pose).includes(t(pose.name, 'zh')));
}
for (const [, title, detail] of Object.values(guidanceMessages)) {
    assert.notEqual(t(title, 'zh'), title);
    assert.notEqual(t(detail, 'zh'), detail);
}
assert.equal(t('Left elbow · try a small adjustment', 'zh'), '左肘 · 稍作调整');
assert.equal(t('Raise your left arm a little, only within a comfortable range.', 'zh'), '稍微抬高左臂，保持舒适的幅度。');
assert.equal(t('Adjust gently toward the reference silhouette. Keep hands under shoulders and knees under hips.', 'zh'), '轻轻向参考轮廓调整。双手在肩部下方，双膝在髋部下方。');
assert.equal(t('Keep steady · 2 seconds remaining', 'zh'), '保持稳定 · 剩余 2 秒');
assert.equal(t('○   REFERENCE PREVIEW', 'zh'), '○ 参考预览');
assert.equal(t('1 movement found', 'zh'), '找到 1 个动作');
assert.equal(t('32 movements to explore', 'zh'), '32 个动作');
assert.equal(t('15 sec', 'zh'), '15 秒');
console.log('PASS: all 32 pose translations, guidance, bilingual search data, dynamic corrections and countdowns.');
