# 课程层级文件

`course/` 只保存稳定课程身份和每学期的开课安排，不保存教材 PDF、QR、音频或逐课制作文件。

```text
course/
├── course-manifest.json
└── offerings/
    └── <offering_id>/
        ├── offering.json
        └── legacy/          # 被替换的学期文件，只作历史证据
```

当前开课实例是 `2026-fall`，主教材为《博雅汉语听说：准中级加速篇 I》。学期时数尚未安排，须在完整理解全书教材后再建立 `semester-overview.md` 与整学期教师手册。

未来同一学期采用多本教材时，直接在 `offering.json` 的 `textbooks` 数组登记，不复制课程目录，也不把教材资料混入 `course/`。
