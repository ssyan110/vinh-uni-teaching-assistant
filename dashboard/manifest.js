window.DASHBOARD_MANIFEST = {
  "schema_version": "2.0",
  "manifest_type": "course-dashboard",
  "generated_at": "2026-08-29",
  "generated_from": {
    "authority_manifests": "lessons/boya-quasi-intermediate-i/lesson-XX/20-approved/lesson-manifest.json",
    "lesson_catalog": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
    "lesson_registry": "course/lesson-registry.json"
  },
  "course": {
    "id": "vinh-chinese-listening-speaking",
    "title": "榮市大學華語聽說中級課程",
    "offering_id": "2026-fall",
    "textbook_id": "boya-quasi-intermediate-i",
    "textbook_title": "《博雅汉语听说：准中级加速篇 I》",
    "lesson_count": 12,
    "lesson_key_format": "<textbook_id>:<lesson_id>",
    "active_lesson_key": "boya-quasi-intermediate-i:lesson-01",
    "lesson_registry": "course/lesson-registry.json",
    "textbooks": [
      {
        "textbook_id": "boya-intermediate-i",
        "title": "《博雅汉语听说：中级冲刺篇 I》",
        "status": "planned_for_2027_fall",
        "lesson_count": 8,
        "lesson_key_prefix": "boya-intermediate-i:",
        "lesson_root": "lessons/boya-intermediate-i",
        "manifest": "textbooks/boya-intermediate-i/textbook.json",
        "source_inventory": "textbooks/boya-intermediate-i/source/source-inventory.json",
        "offering_ids": [
          "2027-fall"
        ]
      },
      {
        "textbook_id": "boya-quasi-intermediate-i",
        "title": "《博雅汉语听说：准中级加速篇 I》",
        "status": "active_source_review",
        "lesson_count": 12,
        "lesson_key_prefix": "boya-quasi-intermediate-i:",
        "lesson_root": "lessons/boya-quasi-intermediate-i",
        "manifest": "textbooks/boya-quasi-intermediate-i/textbook.json",
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "offering_ids": [
          "2026-fall"
        ]
      }
    ],
    "documents": [
      {
        "label": "课程清单",
        "path": "course/course-manifest.json"
      },
      {
        "label": "当前开课实例",
        "path": "course/offerings/2026-fall/offering.json"
      },
      {
        "label": "教材清单",
        "path": "textbooks/registry.json"
      },
      {
        "label": "课次身份索引",
        "path": "course/lesson-registry.json"
      },
      {
        "label": "当前教材",
        "path": "textbooks/boya-quasi-intermediate-i/textbook.json"
      },
      {
        "label": "教材来源索引",
        "path": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json"
      }
    ]
  },
  "summary": {
    "delivered": 0,
    "in_progress": 1,
    "available": 2,
    "draft_available": 3,
    "locked": 8,
    "completed_gates": 1,
    "total_gates": 132,
    "focus_lesson_id": "boya-quasi-intermediate-i:lesson-01",
    "focus_lesson_key": "boya-quasi-intermediate-i:lesson-01",
    "focus_lesson_title": "丽丽是独生女",
    "next_action": "完成「来源审核」并记录证据。"
  },
  "lessons": [
    {
      "id": "boya-quasi-intermediate-i:lesson-01",
      "lesson_key": "boya-quasi-intermediate-i:lesson-01",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-01",
      "number": 1,
      "title": "丽丽是独生女",
      "status": "in_progress",
      "status_label": "制作中",
      "stage": "来源审核",
      "next_action": "完成「来源审核」并记录证据。",
      "unlock_reason": "",
      "draft_available": true,
      "drafts": [
        {
          "mode": null,
          "status": null,
          "output": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/face-to-face/lesson-01-实体课.pptx",
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/face-to-face/manifest.json",
          "compatibility_status": "current_or_explicit"
        },
        {
          "mode": null,
          "status": "draft_refined_from_user_working_copy",
          "output": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/online/lesson-01-在线预习.pptx",
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/online/manifest.json",
          "compatibility_status": "current_or_explicit"
        }
      ],
      "progress": {
        "completed": 1,
        "total": 11,
        "percent": 9
      },
      "catalog": {
        "title": "丽丽是独生女",
        "printed_pages": "1–11",
        "pdf_pages": "14",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 0,
        "exercises": null,
        "audio": 8,
        "authority_files": 3,
        "activity_files": 0
      },
      "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/lesson-manifest.json",
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-02",
      "lesson_key": "boya-quasi-intermediate-i:lesson-02",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-02",
      "number": 2,
      "title": "王红的一天",
      "status": "draft_in_progress",
      "status_label": "草稿製作中",
      "stage": "10-design PPTX draft",
      "next_action": "完成來源語義、教師手冊、配套、QA 與 rehearsal 後，才能升級 authority。",
      "unlock_reason": "來源包與線上／實體邊界已允許 draft；authority／release 仍依序鎖定。",
      "draft_available": true,
      "drafts": [
        {
          "mode": "face-to-face",
          "status": "draft_not_approved",
          "output": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/face-to-face/lesson-02-实体课.pptx",
            "sha256": "18dba00d8243807ad0a5d089fc086fd3ca8b2146a03ab212d00afdbe6c9efea9",
            "bytes": 65845378
          },
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/face-to-face/manifest.json",
          "compatibility_status": "current_or_explicit"
        },
        {
          "mode": "online",
          "status": "draft_not_approved",
          "output": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/online/lesson-02-在线预习.pptx",
            "sha256": "b53c7a25c60136aa61c78d6e0228d0ee6620f990a220821421baae522a6ae0cd",
            "bytes": 102048907
          },
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/online/manifest.json",
          "compatibility_status": "current_or_explicit"
        }
      ],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "王红的一天",
        "printed_pages": "12–21",
        "pdf_pages": "25",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": 10,
        "audio": 7,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-03",
      "lesson_key": "boya-quasi-intermediate-i:lesson-03",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-03",
      "number": 3,
      "title": "我对学中文越来越有兴趣",
      "status": "draft_in_progress",
      "status_label": "草稿製作中",
      "stage": "10-design PPTX draft",
      "next_action": "完成來源語義、教師手冊、配套、QA 與 rehearsal 後，才能升級 authority。",
      "unlock_reason": "來源包與線上／實體邊界已允許 draft；authority／release 仍依序鎖定。",
      "draft_available": true,
      "drafts": [
        {
          "mode": "face-to-face",
          "status": "draft_not_approved",
          "output": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-03/10-design/pptx-draft/face-to-face/lesson-03-实体课.pptx",
            "sha256": "32e406b937e60225825d2a92d125c48d0c1a0dca3c91f4f8981a93ed2ab9b308",
            "bytes": 66601696
          },
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-03/10-design/pptx-draft/face-to-face/manifest.json",
          "compatibility_status": "current_or_explicit"
        },
        {
          "mode": "online",
          "status": "draft_not_approved",
          "output": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-03/10-design/pptx-draft/online/lesson-03-在线预习.pptx",
            "sha256": "5af2b1ea570f532ca5cf85e5b2d12484f9e7dd4b7b8da51f304d6aa8b58a4950",
            "bytes": 108142783
          },
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-03/10-design/pptx-draft/online/manifest.json",
          "compatibility_status": "current_or_explicit"
        }
      ],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "我对学中文越来越有兴趣",
        "printed_pages": "22–31",
        "pdf_pages": "35",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-04",
      "lesson_key": "boya-quasi-intermediate-i:lesson-04",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-04",
      "number": 4,
      "title": "在中国学汉语",
      "status": "draft_legacy_unverified",
      "status_label": "旧草稿待核",
      "stage": "10-design 旧 draft",
      "next_action": "不要沿用旧草稿；先以本课 lesson_key、来源包与边界确认重新建立当前 draft。",
      "unlock_reason": "发现旧生成器草稿，但它没有当前生成器兼容声明，不能作为生产输入。",
      "draft_available": false,
      "drafts": [
        {
          "mode": "face-to-face",
          "status": "draft_not_approved",
          "output": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-04/10-design/pptx-draft/face-to-face/lesson-04-实体课.pptx",
            "sha256": "6f17508a9f276208307c3616f1b01fe4d0abf4dfe59313fd0444c6e534050a08",
            "bytes": 72116863
          },
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-04/10-design/pptx-draft/face-to-face/manifest.json",
          "compatibility_status": "legacy_unverified"
        },
        {
          "mode": "online",
          "status": "draft_not_approved",
          "output": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-04/10-design/pptx-draft/online/lesson-04-在线预习.pptx",
            "sha256": "5b6dd9a1d15be75f281c4c00cb32017ff6ada11c90d88bbe92a4d96e2e10ff9a",
            "bytes": 14513189
          },
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-04/10-design/pptx-draft/online/manifest.json",
          "compatibility_status": "legacy_unverified"
        }
      ],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "在中国学汉语",
        "printed_pages": "32–41",
        "pdf_pages": "45",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-05",
      "lesson_key": "boya-quasi-intermediate-i:lesson-05",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-05",
      "number": 5,
      "title": "我的音乐老师",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 4 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 4 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "我的音乐老师",
        "printed_pages": "42–50",
        "pdf_pages": "55",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-06",
      "lesson_key": "boya-quasi-intermediate-i:lesson-06",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-06",
      "number": 6,
      "title": "大岛参加了学校的合唱团",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 5 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 5 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "大岛参加了学校的合唱团",
        "printed_pages": "51–58",
        "pdf_pages": "64",
        "audio_count": 6,
        "source_inventory_title": "大圣参加了学校的合唱团"
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 8,
        "exercises": 3,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-07",
      "lesson_key": "boya-quasi-intermediate-i:lesson-07",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-07",
      "number": 7,
      "title": "小张热爱登山",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 6 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 6 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "小张热爱登山",
        "printed_pages": "59–67",
        "pdf_pages": "72",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 8,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-08",
      "lesson_key": "boya-quasi-intermediate-i:lesson-08",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-08",
      "number": 8,
      "title": "孙子和《孙子兵法》",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 7 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 7 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "孙子和《孙子兵法》",
        "printed_pages": "68–76",
        "pdf_pages": "81",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 8,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-09",
      "lesson_key": "boya-quasi-intermediate-i:lesson-09",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-09",
      "number": 9,
      "title": "北方菜和南方菜",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 8 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 8 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "北方菜和南方菜",
        "printed_pages": "77–86",
        "pdf_pages": "90",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-10",
      "lesson_key": "boya-quasi-intermediate-i:lesson-10",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-10",
      "number": 10,
      "title": "中国人喜欢聚餐",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 9 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 9 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "中国人喜欢聚餐",
        "printed_pages": "87–95",
        "pdf_pages": "100",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 8,
        "exercises": 3,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-10/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-11",
      "lesson_key": "boya-quasi-intermediate-i:lesson-11",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-11",
      "number": 11,
      "title": "原来他们是关心我",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 10 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 10 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "原来他们是关心我",
        "printed_pages": "96–104",
        "pdf_pages": "109",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/source-manifest.json"
    },
    {
      "id": "boya-quasi-intermediate-i:lesson-12",
      "lesson_key": "boya-quasi-intermediate-i:lesson-12",
      "textbook_id": "boya-quasi-intermediate-i",
      "offering_id": "2026-fall",
      "lesson_id": "lesson-12",
      "number": 12,
      "title": "散步",
      "status": "locked",
      "status_label": "锁定",
      "stage": "等待上一课完成",
      "next_action": "等待第 11 课完成交付后解锁。",
      "unlock_reason": "逐课生产规则：第 11 课尚未完成交付。",
      "draft_available": false,
      "drafts": [],
      "progress": {
        "completed": 0,
        "total": 11,
        "percent": 0
      },
      "catalog": {
        "title": "散步",
        "printed_pages": "105–113",
        "pdf_pages": "118",
        "audio_count": 6
      },
      "scope": {
        "period_count": null,
        "total_minutes": null,
        "ppt_slide_count": null,
        "activity_count": null
      },
      "counts": {
        "source_sections": 10,
        "exercises": null,
        "audio": 6,
        "authority_files": 0,
        "activity_files": null
      },
      "manifest_path": null,
      "source_manifest_path": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/source-manifest.json"
    }
  ],
  "lesson_details": {
    "boya-quasi-intermediate-i:lesson-01": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-01",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-01",
        "lesson_number": 1,
        "title": "丽丽是独生女",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-01",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-manifest.json",
        "authority_manifest": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/lesson-manifest.json",
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "1–11",
        "pdf_page": 14,
        "audio_count": 8,
        "status": {
          "stage": "authority",
          "authority_status": "pptx_chair_approved",
          "content_status": "pptx_approved_by_department_chair_2026-08-29",
          "delivery_status": "pptx_only_handoff_pending_full_package",
          "pptx_draft_status": "promoted_to_locked_authority",
          "release_status": "blocked_pending_full_package"
        }
      },
      "manifest": {
        "schema_version": "1.0",
        "manifest_type": "lesson-authority",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_key": "boya-quasi-intermediate-i:lesson-01",
        "lesson_id": "lesson-01",
        "lesson_number": 1,
        "lesson_title": "丽丽是独生女",
        "language": "简体中文",
        "font_policy": {
          "cjk": "KaiTi",
          "latin": "Times New Roman",
          "updated_at": "2026-08-29"
        },
        "authority_status": "pptx_chair_approved",
        "content_status": "pptx_approved_by_department_chair_2026-08-29",
        "delivery_status": "pptx_only_handoff_pending_full_package",
        "authority_rule": "20-approved 中的批准 PPTX 原样锁定；完整交付仍须补齐来源、教师手册、配套材料、QA、rehearsal 与 release。",
        "approval_record": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/lesson-01-pptx-approval-record.md",
        "source_package": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-01/00-source",
          "status": "active_source_pending_review",
          "note": "本登记只绑定准中级加速篇本课来源；不使用《中级冲刺篇 I》第一课的历史资料作为生产输入。"
        },
        "scope": {
          "approval_scope": "two_current_pptx_only",
          "printed_pages": "1–11",
          "online_slide_count": 72,
          "face_to_face_slide_count": 51,
          "audio_tracks_in_face_to_face_pptx": [
            "1-2",
            "1-3",
            "1-4",
            "1-5",
            "1-6",
            "1-7",
            "1-8"
          ]
        },
        "authority": {
          "pptx": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-实体课.pptx",
            "online_path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
            "status": "final_confirmed",
            "approval_scope": "department_chair_approved_current_decks",
            "version": "chair-approved-2026-08-29",
            "slide_count": 51,
            "online_slide_count": 72,
            "speaker_notes_count": 51,
            "online_speaker_notes_count": 61,
            "sha256": "c476cf51f63f75bc6d9afe4886b6df6a0c38d90e8a90d73e5649160c97b545e1",
            "bytes": 71806730,
            "online_sha256": "7c2c62d4f2d55677181822610524c3fc49a963e5a0bfa042274ab629980bd900",
            "online_bytes": 21626344
          },
          "teacher_manual": {
            "path": null,
            "status": "missing",
            "required": true
          },
          "activities": {
            "path": null,
            "status": "missing",
            "file_count": 0,
            "required": true,
            "format": "DOCX only"
          }
        },
        "design_inputs": {
          "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/canonical-source.json",
          "source_extraction_draft": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-extraction-draft.json",
          "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-manifest.json",
          "audio_manifest": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/audio-manifest.json",
          "pptx_draft_online": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/online/lesson-01-在线预习.pptx",
          "pptx_draft_face_to_face": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/face-to-face/lesson-01-实体课.pptx",
          "teaching_design": null,
          "storyboard": null,
          "visual_storyboard": null,
          "visual_prototype": null
        },
        "qa": {
          "status": "pptx_static_qa_recorded_pending_source_manual_rehearsal",
          "integrity_status": "passed_static",
          "current_path": "lessons/boya-quasi-intermediate-i/lesson-01/30-qa/current/pptx-chair-approved",
          "current_report": "lessons/boya-quasi-intermediate-i/lesson-01/30-qa/current/pptx-chair-approved/qa-report.md",
          "rehearsal": {
            "status": "pending_manual_acceptance",
            "audio_playback_status": "pending_manual_acceptance",
            "evidence": null,
            "audio_playback_evidence": null
          },
          "limitations": [
            "本次静态检查不替代在 Microsoft PowerPoint 中逐段播放音频。",
            "在线预习 PPTX 目前保留系主任批准稿的页眉与页码字号；未因静态规则擅自改动批准内容。",
            "来源内容、1-7／1-8 的语义对应、教师手册与课堂 rehearsal 尚未完成。"
          ]
        },
        "release": {
          "status": "pending_manual_acceptance",
          "delivery_status": "blocked",
          "latest_release_path": null,
          "latest_zip_path": null,
          "blockers": [
            "来源包仍为 source_audit_in_progress。",
            "教师手册和活动材料尚未建立并批准。",
            "完整 storyboard、Visual storyboard、音频人工播放与教师 rehearsal 尚未记录。"
          ]
        },
        "files": [
          {
            "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/lesson-01-pptx-approval-record.md",
            "status": "approval_record",
            "sha256": "3e5c1c963ecb6be1bcc6d17057d21bb3de343f24d650f1c8e05ec9f59a2d1be6",
            "bytes": 1653
          },
          {
            "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
            "status": "final_confirmed",
            "sha256": "7c2c62d4f2d55677181822610524c3fc49a963e5a0bfa042274ab629980bd900",
            "bytes": 21626344
          },
          {
            "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-实体课.pptx",
            "status": "final_confirmed",
            "sha256": "c476cf51f63f75bc6d9afe4886b6df6a0c38d90e8a90d73e5649160c97b545e1",
            "bytes": 71806730
          }
        ]
      },
      "source_manifest": {
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-01",
        "lesson_key": "boya-quasi-intermediate-i:lesson-01",
        "lesson_number": 1,
        "lesson_title": "丽丽是独生女",
        "source_pdf": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
        "answer_pdf": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
        "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/canonical-source.json",
        "canonical_source_sha256": "f630d77a7881e97a121e0877ab7a1ba05048924896187d429b0150cbfd3c6aab",
        "qr_capture_root": "textbooks/boya-quasi-intermediate-i/source/qr/captures",
        "audio_root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-01",
        "status": "source_audit_in_progress",
        "approved": false,
        "notes": [
          "此包只记录来源盘点与 QR／音频证据，不是教师手册、PPT 或 DOCX 成品。"
        ],
        "audio_count": 8,
        "audio_count_note": "6 个出版社 QR 音频 + 2 个教材 P7–P8 标示且已在本地恢复的音频；1-7、1-8 的出版社 QR 映射与语义听核仍待确认。",
        "audio_decode_status": "8/8 files decode passed",
        "audio_manifest": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/audio-manifest.json",
        "audio_technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/audit/audio-technical-2026-08-29.md"
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "review",
          "status_label": "待处理",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-manifest.json"
            },
            {
              "label": "冻结来源资料",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/00-source"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "PPT storyboard manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/storyboard/manifest.json"
            }
          ]
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "done",
          "status_label": "已完成",
          "evidence": [
            {
              "label": "完整课堂 PPTX",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-实体课.pptx"
            }
          ]
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "音档播放与 QA 记录",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/30-qa/current/pptx-chair-approved/qa-report.md"
            }
          ]
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "QA 记录",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/30-qa/current/pptx-chair-approved/qa-report.md"
            }
          ]
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": [
        {
          "id": "authority",
          "title": "20-approved 权威文件",
          "files": [
            {
              "label": "lesson authority manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/lesson-manifest.json"
            },
            {
              "label": "lesson-01-pptx-approval-record.md",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/lesson-01-pptx-approval-record.md"
            },
            {
              "label": "lesson-01-在线预习.pptx",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx"
            },
            {
              "label": "lesson-01-实体课.pptx",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-实体课.pptx"
            }
          ]
        },
        {
          "id": "design",
          "title": "设计与来源证据",
          "files": [
            {
              "label": "来源审核 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-manifest.json"
            },
            {
              "label": "PPT storyboard manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/10-design/storyboard/manifest.json"
            }
          ]
        },
        {
          "id": "qa",
          "title": "QA 与 release 证据",
          "files": [
            {
              "label": "当前 QA 记录",
              "path": "lessons/boya-quasi-intermediate-i/lesson-01/30-qa/current/pptx-chair-approved/qa-report.md"
            }
          ]
        }
      ]
    },
    "boya-quasi-intermediate-i:lesson-02": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-02",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-02",
        "lesson_number": 2,
        "title": "王红的一天",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-02",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "12–21",
        "pdf_page": 25,
        "audio_count": 7,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "technical_audio_passed_7_of_7; 2-7_semantic_and_playback_approved; 2-1_to_2-6_pending",
          "authority_status": "not_created",
          "pptx_draft_status": "generated_not_approved",
          "draft_modes": [
            "online",
            "face-to-face"
          ],
          "release_status": "locked_pending_authority"
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-02",
        "lesson_key": "boya-quasi-intermediate-i:lesson-02",
        "lesson_number": 2,
        "lesson_title": "王红的一天",
        "language": "简体中文",
        "audio_count": 7,
        "audio_count_note": "6 个出版社 QR 音频 + 1 个 Adam 提供并转换的 2-7 来源音频",
        "package": "lesson-02-source-review",
        "prepared_at": "2026-08-29",
        "source_status": "pending_review",
        "source_qa_status": "technical_audio_passed_7_of_7; 2-7_semantic_and_playback_approved; 2-1_to_2-6_pending",
        "extraction_status": "source_review_materialized",
        "review_status": "partial_adam_review_recorded",
        "approved": false,
        "approved_by": [],
        "approved_at": null,
        "adam_review": {
          "status": "partial_approval",
          "approved_by": "Adam",
          "approved_at": "2026-08-29",
          "scope": [
            "audio_track:2-7",
            "source_record",
            "image_assets"
          ],
          "notes": "Adam 确认 2-7 与教材 P18-P19《课外活动》对应并通过播放；L2 图片与来源记录正确。2-1 至 2-6 的语义／PowerPoint 播放状态不因本次确认而改写。"
        },
        "canonical_source": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/canonical-source.json",
          "sha256": "6dfb97de7500c888849dad2a5a1c93978542917d3a725a8aeafe53be16545fe3",
          "status": "source_review_snapshot_with_adam_2-7_confirmation",
          "note": "Adam 已确认 2-7、来源记录与图片；整体课次仍未成为 approved authority。"
        },
        "canonical_source_sha256": "6dfb97de7500c888849dad2a5a1c93978542917d3a725a8aeafe53be16545fe3",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "12-21",
          "pdf_page_range": "25-34",
          "page_count_in_review": 10,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "8-10",
          "printed_page_range_in_review": "答案 P5-P7",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer",
          "continuation_note": "文件页9-10承接三段听力文本；短文三标签为 2-7。"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/source-pages-12-21-audit-draft.md",
          "sha256": "69738d61834d253a9060b755574cf7eced4a60492a4457a5b1596adf53f3ae67",
          "status": "visual_first_pass"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/answer-pages-8-10-audit-draft.md",
          "sha256": "16207446a8ebe132bb4816440bd3cbe41ded1a941ea0f0f55bf9b3ace64823e0",
          "status": "visual_first_pass"
        },
        "qr_source": {
          "qr_url": "http://qr31.cn/H1krER",
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-02-pdf-page-025.png",
          "capture_sha256": "a007a443b36249a9d47ae494c678f9a3d25eca44a17cf945379b9a7c5cf25d16",
          "landing_page": "https://biz.cli.im/site/H1krER?qrurl=http://qr31.cn/H1krER&gtype=2&key=2f3e4171ce1d0df5087828fc7991b4470b28d38181",
          "landing_audio_labels": [
            "2-1",
            "2-2",
            "2-3",
            "2-4",
            "2-5",
            "2-6"
          ],
          "textbook_labels_seen": [
            "2-1",
            "2-2",
            "2-3",
            "2-4",
            "2-5",
            "2-6",
            "2-7"
          ],
          "status": "decoded_landing_page_2-1_to_2-6; user_supplied_2-7_recovered"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-02",
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audio-manifest.json",
          "manifest_sha256": "b2700867ebefaa506cd15721c2591b74a0e16e18cf081cfa5e4070b501c17718",
          "technical_audit": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/audio-technical-2026-08-29.md",
          "technical_audit_sha256": "3aa21e84ccc59edb45eeabddcd83d26075e0451f0ac65a4c6d27ad5747539961",
          "expected_track_count": 7,
          "local_track_count": 7,
          "decode_passed_count": 7,
          "semantic_listening_count": 1,
          "teacher_playback_count": 1,
          "missing_tracks": [],
          "recovered_tracks": [
            "2-7"
          ],
          "status": "technical_pass_for_7_of_7; 2-7_semantic_and_playback_passed; 2-1_to_2-6_pending"
        },
        "listening_exercise_contract": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/listening-exercise-contract.json",
          "sha256": "1b3d105ca9b42b4141a9fd72cfb76aa463c1391c1c8316e8eef0a358dd2cb9fe",
          "status": "draft_pending_source_approval_semantic_audio_review",
          "exercise_count": 10,
          "missing_audio_tracks": []
        },
        "review_evidence": [
          "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/source-pages-12-21-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/answer-pages-8-10-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/audio-technical-2026-08-29.md",
          "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/audio-recovery-2026-08-29.md",
          "lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/adam-review-2026-08-29.md"
        ],
        "counts": {
          "vocabulary": 29,
          "vocabulary_comprehension_groups": 3,
          "vocabulary_comprehension_items": 11,
          "listening_sentence_items": 10,
          "dialogue_items": 5,
          "short_texts": 3,
          "listening_exercise_groups": 7,
          "listening_contract_records": 10,
          "common_expression_groups": 2,
          "grammar_patterns": 15,
          "comprehensive_exercises": 3
        },
        "blockers": [
          "L2 来源记录与图片已由 Adam 确认；整体来源仍需完成剩余音频与课次级批准。",
          "主教材与答案 PDF 显示短文三《课外活动》使用 2-7；Adam 已提供 WAV 并转换为项目 MP3，来源类型记录为用户提供恢复，不改写出版社 QR/source inventory。",
          "2-7 已完成语义听核与 PowerPoint 播放确认；2-1 至 2-6 的教师语义听核与播放实测仍待完成。",
          "开放式口语题、综合填表、分组总结与拓展练习没有唯一标准答案。"
        ],
        "next_minimum_step": "完成 2-1 至 2-6 的语义听核与 PowerPoint 播放；随后记录 L2 整体来源批准，来源批准前不得进入 PBI、教师手册或 PPTX。"
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "review",
          "status_label": "待处理",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-02/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-03": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-03",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-03",
        "lesson_number": 3,
        "title": "我对学中文越来越有兴趣",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-03",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "22–31",
        "pdf_page": 35,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "partial_adam_review_source_and_images_audio_pending",
          "source_qa_status": "source_content_and_images_passed; audio_semantic_playback_pending",
          "authority_status": "not_created",
          "pptx_draft_status": "generated_not_approved",
          "draft_modes": [
            "online",
            "face-to-face"
          ],
          "release_status": "locked_pending_authority"
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-03",
        "lesson_key": "boya-quasi-intermediate-i:lesson-03",
        "lesson_number": 3,
        "lesson_title": "我对学中文越来越有兴趣",
        "language": "简体中文",
        "package": "lesson-03-source-review",
        "prepared_at": "2026-08-29",
        "source_status": "partial_adam_review_source_and_images_audio_pending",
        "source_qa_status": "source_content_and_images_passed; audio_semantic_playback_pending",
        "extraction_status": "source_review_materialized",
        "review_status": "source_and_images_approved_by_adam",
        "approved": false,
        "approved_by": [],
        "approved_at": null,
        "approval_scope": [
          "source_content",
          "image_assets",
          "wording:越来越"
        ],
        "adam_review": {
          "status": "source_and_images_approved",
          "approved_by": "Adam",
          "approved_at": "2026-08-29",
          "scope": [
            "source_content",
            "image_assets",
            "wording:越来越"
          ],
          "notes": "Adam 确认第三课来源与图片全部正确；短文三题目使用“越来越”。六段音频仍保留各自的教师语义听核与播放状态，未因本次来源／图片确认而改写。"
        },
        "canonical_source": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/canonical-source.json",
          "sha256": "821f8009e7ec2b53d9f38b7adcb2421f0012c4730b61cc8db6a08bf2c59c5aa1",
          "status": "partial_source_and_images_approved_audio_pending",
          "note": "Adam 已确认来源内容、图片与“越来越”用字；音频语义听核／播放仍为独立 QA 项。"
        },
        "canonical_source_sha256": "821f8009e7ec2b53d9f38b7adcb2421f0012c4730b61cc8db6a08bf2c59c5aa1",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "22–31",
          "pdf_page_range": "35–44",
          "page_count_in_review": 10,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "11–13",
          "index_range": "[11,13]",
          "continuation_note": "文件页12为本课听力文本主体；文件页13承接短文三续段；来源盘点使用区间端点记录，需人工确认编号口径。",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/source-pages-22-31-audit-draft.md",
          "sha256": "34cd11890ea491b74a6e841857f7be5cfbf1f932185e362eb86febbcc40b8c2c",
          "status": "visual_review_confirmed_by_adam_2026-08-29"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/answer-pages-11-13-audit-draft.md",
          "sha256": "91f567962a8ecec58ba39a40a491483c3ee36a94b6c5b9685f3526c3b50d5078",
          "status": "visual_review_confirmed_by_adam_2026-08-29"
        },
        "qr_source": {
          "qr_url": "http://qr31.cn/IeruLV",
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-03-pdf-page-035.png",
          "landing_page": "https://biz.cli.im/site/IeruLV?qrurl=http://qr31.cn/IeruLV&gtype=2&key=82ff4173cf8bafe74878285867a6fa3f53d5dc1924",
          "landing_audio_labels": [
            "3-1",
            "3-2",
            "3-3",
            "3-4",
            "3-5",
            "3-6"
          ],
          "status": "source_inventory_verified"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-03",
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audio-manifest.json",
          "manifest_sha256": "a1ed9e45e39cc0707864ce4e731fe32787e4bc04856089886a383e52fa7f06f8",
          "technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/audio-technical-2026-08-28.md",
          "track_count": 6,
          "status": "technical_pass_semantic_pending"
        },
        "listening_exercise_contract": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/listening-exercise-contract.json",
          "sha256": "a40cf98a075eb3d515208b980548fd5817da1968c8dcf5cfdf37093f3dc07c3c",
          "status": "source_content_approved_audio_semantic_pending",
          "exercise_count": 9
        },
        "review_evidence": [
          "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/source-pages-22-31-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/answer-pages-11-13-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/audio-technical-2026-08-28.md",
          "lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/adam-review-2026-08-29.md"
        ],
        "blockers": [
          "六段音频已完成文件存在、bytes、SHA-256、ffprobe 时长和解码核对；教师逐段语义听核及 PowerPoint 实际播放测试尚未完成。",
          "扫描 PDF 无可用文字层；视觉转录、题目和教材印刷页码已由 Adam 确认。",
          "开放式口语、综合填表、小组总结和拓展练习没有唯一标准答案，不补写答案。"
        ],
        "next_minimum_step": "完成六段音频的教师语义听核与 PowerPoint 播放测试；来源内容、图片与“越来越”用字已批准，音频 QA 完成后再更新 authority 设计与 PPTX 升格 gate。"
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "review",
          "status_label": "待处理",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-03/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-04": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-04",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-04",
        "lesson_number": 4,
        "title": "在中国学汉语",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-04",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "32–41",
        "pdf_page": 45,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "blocked",
          "authority_status": "not_created",
          "pptx_draft_status": "legacy_unverified_do_not_use",
          "release_status": "locked_pending_source_and_current_builder"
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-04",
        "lesson_key": "boya-quasi-intermediate-i:lesson-04",
        "lesson_number": 4,
        "lesson_title": "在中国学汉语",
        "language": "简体中文",
        "package": "lesson-04-source-review",
        "prepared_at": "2026-08-28",
        "source_status": "pending_review",
        "source_qa_status": "blocked",
        "extraction_status": "source_review_materialized",
        "review_status": "awaiting_adam_review",
        "approved": false,
        "approved_by": [],
        "approved_at": null,
        "canonical_source": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/canonical-source.json",
          "sha256": "0eb2afac761ba8a31682ae74cabf4a6faeebbd5e23ba8ea5d94b424014fe9aee",
          "status": "source_review_snapshot",
          "note": "结构化内容可供审核和下游 content-contract 草稿使用；尚未成为 approved authority。"
        },
        "canonical_source_sha256": "0eb2afac761ba8a31682ae74cabf4a6faeebbd5e23ba8ea5d94b424014fe9aee",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "total_pages": 134,
          "textbook_page_range": "32–41",
          "pdf_page_range": "45–54",
          "page_count_in_review": 10,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "file_pages_in_review": "14–16",
          "index_range": "P14–P15",
          "continuation_note": "文件页16（答案印刷P13）承接短文三听力文本末段"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audit/source-pages-32-41-audit-draft.md",
          "sha256": "66d3de51fde07b0206195e24f2e49ece906b0ae13a0fe7d7670e1bb18d5de6f8",
          "status": "draft"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audit/answer-pages-14-16-audit-draft.md",
          "sha256": "b4a1ce58f1e05c2d7b8fed960b94fbc0aa675d56317f0a897a085c192c5d8de4",
          "status": "draft"
        },
        "qr_source": {
          "qr_url": "http://qr31.cn/I9bLMV",
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-04-pdf-page-045.png",
          "landing_page": "https://biz.cli.im/site/I9bLMV?qrurl=http://qr31.cn/I9bLMV&gtype=2&key=c36f817489cc67e6287828f1f97c00a7fc43446948",
          "landing_audio_labels": [
            "4-1",
            "4-2",
            "4-3",
            "4-4",
            "4-5",
            "4-6"
          ],
          "status": "source_inventory_verified"
        },
        "audio": {
          "manifest_path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audio-manifest.json",
          "manifest_sha256": "6ac862deb05b2ba93ce7bf3c5b1e6dd15ea870931244e36ab91083a7aa4d20bc",
          "technical_audit": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audit/audio-technical-2026-08-28.md",
          "track_count": 6,
          "status": "technical_pass_semantic_pending"
        },
        "listening_exercise_contract": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/listening-exercise-contract.json",
          "sha256": "3888ee24eb40850b53bdfe2ec10dec396e51c5ec7dac6103ace6657dccbc8892",
          "status": "draft",
          "exercise_count": 9
        },
        "review_evidence": [
          "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audit/source-pages-32-41-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audit/answer-pages-14-16-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-04/00-source/audit/audio-technical-2026-08-28.md"
        ],
        "blockers": [
          "来源尚未 Adam 批准。",
          "六段音频尚未教师逐段语义听核与 PowerPoint 实际播放测试。",
          "扫描 PDF 的视觉转录仍需教师复核。",
          "开放式口语题、综合填表和拓展练习没有唯一标准答案。"
        ],
        "next_minimum_step": "Adam 审核 canonical source、六个听力题组标题／页码／题目与答案证据；通过后再进入 PBI 教学设计。"
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-04/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-05": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-05",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-05",
        "lesson_number": 5,
        "title": "我的音乐老师",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-05",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "42–50",
        "pdf_page": 55,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "blocked",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-05",
        "lesson_key": "boya-quasi-intermediate-i:lesson-05",
        "lesson_number": 5,
        "lesson_title": "我的音乐老师",
        "language": "简体中文",
        "package": "lesson-05-source-review",
        "prepared_at": "2026-08-28",
        "source_status": "pending_review",
        "source_qa_status": "blocked",
        "extraction_status": "source_review_materialized",
        "review_status": "awaiting_adam_review",
        "approved": false,
        "approved_by": null,
        "approved_at": null,
        "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/canonical-source.json",
        "canonical_source_sha256": "d7f8283e371bef2e4d40e1ae7f6458ae8a43e92f7e489d467bc902317625a509",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "42–50",
          "pdf_page_range": "55–63",
          "page_count_in_review": 9,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "17–18",
          "answer_page_range": "14–15 (inventory label P16–P17 pending confirmation)",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/audit/source-pages-42-50-audit-draft.md",
          "sha256": "054e18da9330f3ef6119ef23110dec65d95d7852b9dfa68fc8942780e94a1d00",
          "status": "visual_first_pass"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/audit/source-pages-42-50-audit-draft.md",
          "sha256": "054e18da9330f3ef6119ef23110dec65d95d7852b9dfa68fc8942780e94a1d00",
          "status": "answer_pages_17-18_included_in_visual_first_pass"
        },
        "qr_source": {
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-05-pdf-page-055.png",
          "capture_sha256": "19753958db05ed1c7464308578ee577d23e346f37d186f4741f2a42b9c40917a",
          "qr_url": "http://qr31.cn/I69bRX",
          "landing_page": "https://biz.cli.im/site/I69bRX?qrurl=http://qr31.cn/I69bRX&gtype=2&key=51706170bd8e6b559878288aae4fdb0723d68a5972",
          "status": "decoded_landing_page_lists_5-1_to_5-6"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-05",
          "manifest": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/audio-manifest.json",
          "manifest_sha256": "8881142e2803efd2d289ee11c9b2dcf5f0c06298982ce685a53fca399c513189",
          "technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/audit/audio-technical-2026-08-28.md",
          "technical_evidence_sha256": "da52ee1da4b1416da844edcffc78500b3f8c4e376985ff1e5cad11b398db052b",
          "expected_track_count": 6,
          "local_track_count": 6,
          "decode_passed_count": 6,
          "semantic_listening_count": 0,
          "teacher_playback_count": 0,
          "status": "technical_pass_semantic_review_pending"
        },
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/listening-exercise-contract.json",
        "listening_exercise_contract_sha256": "8189422789bb71d6a3ccd11328b12894aa8dc27658ab6f2f154de1edc98ca26d",
        "listening_exercise_contract_detail": {
          "status": "draft_pending_source_approval",
          "exercise_count": 9
        },
        "review_evidence": {
          "page_range": "P42–P50",
          "answer_page_range": "答案 PDF 第17–18页／印刷 P14–P15（待确认）",
          "vocabulary_count": 24,
          "proper_noun_count": 2,
          "vocabulary_comprehension_group_count": 2,
          "vocabulary_comprehension_item_count": 7,
          "listening_sentence_item_count": 10,
          "short_text_count": 3,
          "short_text_listen_group_count": 6,
          "common_expression_group_count": 3,
          "comprehensive_practice_count": 3,
          "open_presentational_tasks": true,
          "status": "page_answer_audio_mapping_written; final source approval pending"
        },
        "blockers": [
          "六段音频仅完成文件存在、bytes、SHA-256、ffprobe 时长和解码核对；教师逐段播放及语义听核尚未完成。",
          "扫描教材无可用文字层；最终来源批准需由 Adam 对视觉转录、教材页码和答案证据确认。",
          "来源批准前不得进入教师手册、配套材料、PPT storyboard 或 PPTX 生成 gate。"
        ],
        "notes": [
          "此包只记录来源盘点、页面证据、QR／音频映射与结构化草稿。",
          "canonical-source.json 与 listening-exercise-contract.json 尚未成为 approved authority。",
          "audio-manifest.json 只证明技术文件映射；semantic_status 与 teacher_playback_status 保持 pending。"
        ]
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-05/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-06": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-06",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-06",
        "lesson_number": 6,
        "title": "大岛参加了学校的合唱团",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-06",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "51–58",
        "pdf_page": 64,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "technical_audio_passed_semantic_playback_pending",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "quasi-intermediate-source-manifest-v1.0",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-06",
        "lesson_key": "boya-quasi-intermediate-i:lesson-06",
        "lesson_number": 6,
        "lesson_title": "大岛参加了学校的合唱团",
        "source_status": "pending_review",
        "source_qa_status": "technical_audio_passed_semantic_playback_pending",
        "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/canonical-source.json",
        "canonical_source_sha256": "ae88de058a7db884300baabbd9a899486b991ecfc06e1998ee58e7b65b29593b",
        "listening_exercise_contract_sha256": "a6681c0bec3f3a3f03c13f187b81ae3915a0bc1e57df4a0a10a53a08d153489a",
        "audio_manifest_sha256": "2977587fe3ba1f07b0598a35197d6726bf8a04797155934386ff56e37d129cec",
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/listening-exercise-contract.json",
        "audio_manifest": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/audio-manifest.json",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "pdf_pages": [
            64,
            71
          ],
          "printed_pages": [
            51,
            58
          ],
          "format": "scanned_image_pdf",
          "text_layer_status": "empty"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "pdf_pages": [
            19,
            20
          ],
          "printed_pages": [
            16,
            17
          ],
          "note": "lesson-06 transcript begins on PDF page 19 and continues on 20; inventory table lists 18-19 and requires reconciliation"
        },
        "qr": {
          "pdf_page": 64,
          "url": "http://qr31.cn/I4detK",
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-06-pdf-page-064.png"
        },
        "counts": {
          "vocabulary": 25,
          "listening_exercise_groups": 6,
          "short_texts": 3,
          "common_expression_groups": 2,
          "comprehensive_exercises": 3
        },
        "approved": false,
        "blockers": [
          "source-inventory OCR title 大圣 is retained as a historical discrepancy; Adam confirmed the printed title/person name 大岛 on 2026-08-29",
          "semantic listening and PowerPoint playback not yet completed"
        ],
        "adam_review": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/audit/adam-review-2026-08-29.md",
          "status": "partial_title_and_name_confirmation",
          "confirmed_at": "2026-08-29"
        },
        "audit_files": [
          "audit/source-pages-51-58-audit-draft.md",
          "audit/answer-pages-18-19-audit-draft.md",
          "audit/audio-technical-2026-08-28.md"
        ]
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-06/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-07": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-07",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-07",
        "lesson_number": 7,
        "title": "小张热爱登山",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-07",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "59–67",
        "pdf_page": 72,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "blocked",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-07",
        "lesson_key": "boya-quasi-intermediate-i:lesson-07",
        "lesson_number": 7,
        "lesson_title": "小张热爱登山",
        "language": "简体中文",
        "package": "lesson-07-source-review",
        "prepared_at": "2026-08-28",
        "source_status": "pending_review",
        "source_qa_status": "blocked",
        "extraction_status": "source_review_materialized",
        "review_status": "awaiting_adam_review",
        "approved": false,
        "approved_by": [],
        "approved_at": null,
        "canonical_source": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/canonical-source.json",
          "sha256": "6672fe355e5a4a5359facbaccb6493e09552108ddea61eaf91dddae9685e9bc4",
          "status": "source_review_snapshot"
        },
        "canonical_source_sha256": "6672fe355e5a4a5359facbaccb6493e09552108ddea61eaf91dddae9685e9bc4",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "59–67",
          "pdf_page_range": "72–81",
          "page_count_in_review": 10,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "20–21",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/audit/source-pages-59-67-audit-draft.md",
          "sha256": "38a63346d5199aad4d96ee6b2459aa02ff91bc6f61169510d749ddf396eb9a38",
          "status": "visual_first_pass"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/audit/answer-pages-20-21-audit-draft.md",
          "sha256": "ff6c51bcc04c7e31a30bf1dd80e079960be94eae2eecdc216ec68b8fdcb358da",
          "status": "visual_first_pass"
        },
        "qr_source": {
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-07-pdf-page-072.png",
          "qr_url": "http://qr31.cn/I7dyDT",
          "landing_page": "https://biz.cli.im/site/I7dyDT?qrurl=http://qr31.cn/I7dyDT&gtype=2&key=1f37b1766d5d24adc878292076608ec1b666357015",
          "status": "decoded_landing_page_lists_1_to_6"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-07",
          "manifest": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/audio-manifest.json",
          "manifest_sha256": "362496771294081ee42f781ba863d6c329303f4baa62ba8ecec0f616c33b3574",
          "technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/audit/audio-technical-2026-08-28.md",
          "expected_track_count": 6,
          "local_track_count": 6,
          "decode_passed_count": 6,
          "semantic_listening_count": 0,
          "teacher_playback_count": 0,
          "status": "technical_pass_semantic_review_pending"
        },
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/listening-exercise-contract.json",
        "listening_exercise_contract_sha256": "1fd3a4f5e019de8d2d57a9dd7acd2973c12cd88c4176543071f51afbee6d87fd",
        "listening_exercise_contract_detail": {
          "status": "draft_validated",
          "exercise_count": 9
        },
        "review_evidence": {
          "page_range": "P59–P67",
          "answer_page_range": "答案 PDF P20–P21",
          "vocabulary_count": 26,
          "proper_noun_count": 0,
          "short_text_count": 3,
          "short_text_listen_group_count": 6,
          "status": "page_answer_audio_mapping_written; final source approval pending"
        },
        "blockers": [
          "六段音频技术核验通过；语义听核和教师播放实测待完成。",
          "扫描教材无文字层；需 Adam 核对视觉转录、页码和答案证据。",
          "开放式题目无唯一答案，保持答案政策。"
        ],
        "next_minimum_step": "Adam 审核 canonical source 与 listening exercise contract"
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-07/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-08": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-08",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-08",
        "lesson_number": 8,
        "title": "孙子和《孙子兵法》",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-08",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "68–76",
        "pdf_page": 81,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "blocked",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-08",
        "lesson_key": "boya-quasi-intermediate-i:lesson-08",
        "lesson_number": 8,
        "lesson_title": "孙子和《孙子兵法》",
        "language": "简体中文",
        "package": "lesson-08-source-review",
        "prepared_at": "2026-08-28",
        "source_status": "pending_review",
        "source_qa_status": "blocked",
        "extraction_status": "source_review_materialized",
        "review_status": "awaiting_adam_review",
        "approved": false,
        "approved_by": [],
        "approved_at": null,
        "canonical_source": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/canonical-source.json",
          "sha256": "8667e605b2753f7baac33cbc211102647088b6ea9c90d20aa5803ab377e3f109",
          "status": "source_review_snapshot"
        },
        "canonical_source_sha256": "8667e605b2753f7baac33cbc211102647088b6ea9c90d20aa5803ab377e3f109",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "68–76",
          "pdf_page_range": "81–90",
          "page_count_in_review": 10,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "22–23",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/audit/source-pages-68-76-audit-draft.md",
          "sha256": "7192ce621b122815ae9caee1650e6b9a8d777956bb7f8a4a0f27d31e94e4043e",
          "status": "visual_first_pass"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/audit/answer-pages-22-23-audit-draft.md",
          "sha256": "d3490d7409dcc73b454bba807197846f5bf91a591f06d5157d3b6c86b1001d4c",
          "status": "visual_first_pass"
        },
        "qr_source": {
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-08-pdf-page-081.png",
          "qr_url": "http://qr31.cn/JjDVWY",
          "landing_page": "https://biz.cli.im/site/JjDVWY?qrurl=http://qr31.cn/JjDVWY&gtype=2&key=67ae517d4ac066c8b87829448cdeba53bf434f2028",
          "status": "decoded_landing_page_lists_1_to_6"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-08",
          "manifest": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/audio-manifest.json",
          "manifest_sha256": "ded3c457de89e6f1faab52f51fa2ff6bc53604651dda86a78aafb20215e442e1",
          "technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/audit/audio-technical-2026-08-28.md",
          "expected_track_count": 6,
          "local_track_count": 6,
          "decode_passed_count": 6,
          "semantic_listening_count": 0,
          "teacher_playback_count": 0,
          "status": "technical_pass_semantic_review_pending"
        },
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/listening-exercise-contract.json",
        "listening_exercise_contract_sha256": "dce6eb8c7a7477d2535ac7c3f3cd63f9e232bdd5db75d148f491ab66803ca81d",
        "listening_exercise_contract_detail": {
          "status": "draft_validated",
          "exercise_count": 9
        },
        "review_evidence": {
          "page_range": "P68–P76",
          "answer_page_range": "答案 PDF P22–P23",
          "vocabulary_count": 29,
          "proper_noun_count": 2,
          "short_text_count": 3,
          "short_text_listen_group_count": 6,
          "status": "page_answer_audio_mapping_written; final source approval pending"
        },
        "blockers": [
          "六段音频技术核验通过；语义听核和教师播放实测待完成。",
          "扫描教材无文字层；需 Adam 核对视觉转录、页码和答案证据。",
          "开放式题目无唯一答案，保持答案政策。"
        ],
        "next_minimum_step": "Adam 审核 canonical source 与 listening exercise contract"
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-08/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-09": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-09",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-09",
        "lesson_number": 9,
        "title": "北方菜和南方菜",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-09",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "77–86",
        "pdf_page": 90,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": null,
          "source_qa_status": null,
          "status": "pending_review"
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "quasi-intermediate-source-manifest-v1",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-09",
        "lesson_key": "boya-quasi-intermediate-i:lesson-09",
        "lesson_number": 9,
        "title": "北方菜和南方菜",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "pdf_pages": [
            90,
            99
          ],
          "printed_pages": [
            77,
            86
          ]
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "inventory_pages": [
            24,
            25
          ],
          "visual_render_internal_pages": [
            25,
            26
          ],
          "visual_printed_labels": [
            22,
            23
          ],
          "page_numbering_status": "pending_adam_confirmation"
        },
        "qr": {
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-09-pdf-page-090.png",
          "url": "http://qr31.cn/IloNOS",
          "landing_page": "https://biz.cli.im/site/IloNOS?qrurl=http://qr31.cn/IloNOS&gtype=2&key=995d2170976559ed387829f37eb237b28eec029042",
          "status": "verified_in_source_inventory"
        },
        "canonical_source": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/canonical-source.json",
          "sha256": "2284f4741b1f2393e9d036c9887b257e8dda87f36e38370473002d462484877d"
        },
        "listening_contract": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/listening-exercise-contract.json",
          "sha256": "55ced7e6847745c70453c4ddf09af71a5fb7265d646773091f4b68e07a38da98",
          "count": 9
        },
        "audio_manifest": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/audio-manifest.json",
          "sha256": "a56870a2d601ad5a6eb082bb169e081df7def71005edfcfa567c8d695cb288a6",
          "audio_root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-09",
          "count": 6,
          "technical_status": "6/6 files present; bytes, SHA-256, duration and decode passed",
          "semantic_status": "pending_teacher_playback"
        },
        "audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/audit/source-pages-77-86-audit-draft.md",
          "sha256": "3589fdf7417fc2945a69e0f0c1272ee2b35e8951e5ba245f26554b8ecd3e01a1",
          "status": "draft"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/audit/answer-pages-24-25-audit-draft.md",
          "sha256": "d11a91b60fc30122a4c80aa7296720575c9f4b59a6022d1c27da28ac0a2b34b7",
          "status": "draft",
          "scope": "答案页码口径、封闭答案、9-4/9-5/9-6视觉听力文本和开放题答案政策"
        },
        "audio_technical_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/audit/audio-technical-2026-08-28.md",
          "sha256": "a2afb6ad3b764a44bd870d00d64c2a420bd183511b1cdbb6d4856f208b55dda7",
          "status": "technical_pass_semantic_pending",
          "scope": "六段 MP3 文件、bytes、SHA-256、时长和解码"
        },
        "status": "pending_review",
        "approved": false,
        "approved_by": [],
        "approved_at": null,
        "notes": [
          "本 source package 只记录来源盘点、页面／板块、听力题组契约、音频技术状态和答案证据；不构成教学手册、PPT 或 release authority。",
          "所有音频 semantic_status 与 playback_status 保持 pending_teacher_playback；来源及 Adam 审核未完成前不得进入 20-approved。"
        ]
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-10": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-10",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-10",
        "lesson_number": 10,
        "title": "中国人喜欢聚餐",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-10",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-10/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "87–95",
        "pdf_page": 100,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "technical_audio_passed_semantic_playback_pending",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "quasi-intermediate-source-manifest-v1.0",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-10",
        "lesson_key": "boya-quasi-intermediate-i:lesson-10",
        "lesson_number": 10,
        "lesson_title": "中国人喜欢聚餐",
        "source_status": "pending_review",
        "source_qa_status": "technical_audio_passed_semantic_playback_pending",
        "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-10/00-source/canonical-source.json",
        "canonical_source_sha256": "8f3cf1f0ab7d4b570aa20318164420151932f61784e8f3f3f06371fae886754e",
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-10/00-source/listening-exercise-contract.json",
        "listening_exercise_contract_sha256": "3e072acb38dffb2c05bafca823c279417dd99a26349e5d25196e6752dfff6896",
        "audio_manifest": "lessons/boya-quasi-intermediate-i/lesson-10/00-source/audio-manifest.json",
        "audio_manifest_sha256": "c48f88b65712d1445b0509809b0de16158db05fbfa3394b59ac1e227c85dc771",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "pdf_pages": [
            100,
            108
          ],
          "printed_pages": [
            87,
            95
          ],
          "format": "scanned_image_pdf",
          "text_layer_status": "empty"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "pdf_pages": [
            27,
            28
          ],
          "note": "lesson transcript visually begins on PDF 27 and continues on 28; inventory table lists 26-27"
        },
        "qr": {
          "pdf_page": 100,
          "url": "http://qr31.cn/HdituA",
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-10-pdf-page-100.png"
        },
        "counts": {
          "vocabulary": 27,
          "listening_exercise_groups": 6,
          "short_texts": 3,
          "common_expression_groups": 2,
          "comprehensive_exercises": 3
        },
        "approved": false,
        "blockers": [
          "六段音频尚未教师逐段语义听核与 PowerPoint 播放测试",
          "扫描 PDF 最终文字转录仍需教师/Adam 复核"
        ],
        "audit_files": [
          "lessons/boya-quasi-intermediate-i/lesson-10/00-source/audit/source-pages-87-95-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-10/00-source/audit/answer-pages-26-27-audit-draft.md",
          "lessons/boya-quasi-intermediate-i/lesson-10/00-source/audit/audio-technical-2026-08-28.md"
        ]
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-10/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-11": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-11",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-11",
        "lesson_number": 11,
        "title": "原来他们是关心我",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-11",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "96–104",
        "pdf_page": 109,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "blocked",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-11",
        "lesson_key": "boya-quasi-intermediate-i:lesson-11",
        "lesson_number": 11,
        "lesson_title": "原来他们是关心我",
        "language": "简体中文",
        "package": "lesson-11-source-review",
        "prepared_at": "2026-08-28",
        "source_status": "pending_review",
        "source_qa_status": "blocked",
        "extraction_status": "source_review_materialized",
        "review_status": "awaiting_adam_review",
        "approved": false,
        "approved_by": null,
        "approved_at": null,
        "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/canonical-source.json",
        "canonical_source_sha256": "c7c4c4bbcb3b28daffaa11dcb4660d8278427287f303774934aebd6ac75baf9f",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "96–104",
          "pdf_page_range": "109–117",
          "page_count_in_review": 9,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "26–27",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/audit/source-pages-96-104-audit-draft.md",
          "sha256": "66026bd585d3d811161f83b61343ecfb07a6236cff8c60d9ea90e1a0cab11cbe",
          "status": "visual_first_pass"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/audit/source-pages-96-104-audit-draft.md",
          "sha256": "66026bd585d3d811161f83b61343ecfb07a6236cff8c60d9ea90e1a0cab11cbe",
          "status": "answer_pages_26-27_included_in_visual_first_pass"
        },
        "qr_source": {
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-11-pdf-page-109.png",
          "qr_url": "http://qr31.cn/H7bvDX",
          "landing_page": "https://biz.cli.im/site/H7bvDX?qrurl=http://qr31.cn/H7bvDX&gtype=2&key=b6d1d17498544ca2d87829c404bd59a05af5798075",
          "status": "decoded_landing_page_lists_11-1_to_11-6"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-11",
          "manifest": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/audio-manifest.json",
          "manifest_sha256": "fef4f9657e699e9fa9bbe0006173a3c93901e88f3b2726c45496f864ae605ab1",
          "technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/audit/audio-technical-2026-08-28.md",
          "expected_track_count": 6,
          "local_track_count": 6,
          "decode_passed_count": 6,
          "semantic_listening_count": 0,
          "teacher_playback_count": 0,
          "status": "technical_pass_semantic_review_pending"
        },
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/listening-exercise-contract.json",
        "listening_exercise_contract_sha256": "2c3f7c7e9f69402f6f152c80d0b8187ddea559cee4afde3671c9ff419ae394f1",
        "listening_exercise_contract_detail": {
          "status": "draft",
          "exercise_count": 9
        },
        "review_evidence": {
          "page_range": "P96–P104",
          "answer_page_range": "答案 PDF P26–P27",
          "vocabulary_count": 23,
          "idiom_count": 3,
          "vocabulary_comprehension_group_count": 1,
          "listening_sentence_item_count": 10,
          "short_text_count": 3,
          "short_text_listen_group_count": 6,
          "common_expression_group_count": 3,
          "comprehensive_practice_count": 3,
          "status": "page_answer_audio_mapping_written; final source approval pending"
        },
        "blockers": [
          "六段音频仅完成技术核验；语义听核与教师播放实测 pending。",
          "扫描教材无文字层；需 Adam 终审视觉转录、页码和答案证据。",
          "来源批准前不得进入教师手册、配套材料、PPT storyboard 或 PPTX 生成 gate。"
        ]
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-11/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    },
    "boya-quasi-intermediate-i:lesson-12": {
      "identity": {
        "lesson_key": "boya-quasi-intermediate-i:lesson-12",
        "course_id": "vinh-chinese-listening-speaking",
        "offering_ids": [
          "2026-fall"
        ],
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-12",
        "lesson_number": 12,
        "title": "散步",
        "lesson_path": "lessons/boya-quasi-intermediate-i/lesson-12",
        "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/source-manifest.json",
        "authority_manifest": null,
        "source_inventory": "textbooks/boya-quasi-intermediate-i/source/source-inventory.json",
        "printed_pages": "105–113",
        "pdf_page": 118,
        "audio_count": 6,
        "status": {
          "stage": "source",
          "source_status": "pending_review",
          "source_qa_status": "blocked",
          "status": null
        }
      },
      "manifest": null,
      "source_manifest": {
        "schema_version": "boya-lesson-source-manifest-v1",
        "manifest_type": "lesson-source-review",
        "course_id": "vinh-chinese-listening-speaking",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-12",
        "lesson_key": "boya-quasi-intermediate-i:lesson-12",
        "lesson_number": 12,
        "lesson_title": "散步",
        "language": "简体中文",
        "package": "lesson-12-source-review",
        "prepared_at": "2026-08-28",
        "source_status": "pending_review",
        "source_qa_status": "blocked",
        "extraction_status": "source_review_materialized",
        "review_status": "awaiting_adam_review",
        "approved": false,
        "approved_by": null,
        "approved_at": null,
        "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/canonical-source.json",
        "canonical_source_sha256": "d465dec552b8efef27dea0d9f0d772634e45eb6db4cfd4caf5e99cbc547d6f01",
        "source_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
          "sha256": "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806",
          "total_pages": 134,
          "textbook_page_range": "105–113",
          "pdf_page_range": "118–126",
          "page_count_in_review": 9,
          "format": "scanned_image_pdf",
          "text_layer_status": "empty; visual review used"
        },
        "answer_pdf": {
          "path": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf",
          "sha256": "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8",
          "total_pages": 33,
          "pdf_page_range_in_review": "28–29",
          "answer_status": "closed_answers_visual_checked; open_tasks_have_no_unique_answer"
        },
        "page_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/audit/source-pages-105-113-audit-draft.md",
          "sha256": "db1cc29bb4b6eaf19473af47498cb15baf4e5d93449d10e5beeba178b97f9142",
          "status": "visual_first_pass"
        },
        "answer_audit": {
          "path": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/audit/source-pages-105-113-audit-draft.md",
          "sha256": "db1cc29bb4b6eaf19473af47498cb15baf4e5d93449d10e5beeba178b97f9142",
          "status": "answer_pages_28-29_included_in_visual_first_pass"
        },
        "qr_source": {
          "capture": "textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-12-pdf-page-118.png",
          "qr_url": "http://qr31.cn/IhjvBZ",
          "landing_page": "https://biz.cli.im/site/IhjvBZ?qrurl=http://qr31.cn/IhjvBZ&gtype=2&key=57f6317855318c071878297e5609bf670214049105",
          "status": "decoded_landing_page_lists_12-1_to_12-6"
        },
        "audio": {
          "root": "textbooks/boya-quasi-intermediate-i/source/audio/lesson-12",
          "manifest": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/audio-manifest.json",
          "manifest_sha256": "205f334a669ef3d7b5d23853f8b5b22d0615c8b70c0d1f615c4ec541d8dfb458",
          "technical_evidence": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/audit/audio-technical-2026-08-28.md",
          "expected_track_count": 6,
          "local_track_count": 6,
          "decode_passed_count": 6,
          "semantic_listening_count": 0,
          "teacher_playback_count": 0,
          "status": "technical_pass_semantic_review_pending"
        },
        "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/listening-exercise-contract.json",
        "listening_exercise_contract_sha256": "d7f8b7ebd5a588e3b5eba1137abcd3e560ae15da915762fc29bba5460873db76",
        "listening_exercise_contract_detail": {
          "status": "draft",
          "exercise_count": 9
        },
        "review_evidence": {
          "page_range": "P105–P113",
          "answer_page_range": "答案 PDF P28–P29",
          "vocabulary_count": 27,
          "vocabulary_comprehension_group_count": 1,
          "listening_sentence_item_count": 10,
          "short_text_count": 3,
          "short_text_listen_group_count": 6,
          "common_expression_group_count": 3,
          "comprehensive_practice_count": 3,
          "status": "page_answer_audio_mapping_written; final source approval pending"
        },
        "blockers": [
          "六段音频仅完成技术核验；语义听核与教师播放实测 pending。",
          "扫描教材无文字层；需 Adam 终审视觉转录、页码和答案证据。",
          "来源批准前不得进入教师手册、配套材料、PPT storyboard 或 PPTX 生成 gate。"
        ]
      },
      "gates": [
        {
          "number": 1,
          "id": "source_review",
          "title": "来源审核",
          "description": "核对教材 PDF、区段、练习、音频与答案政策。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": [
            {
              "label": "来源 manifest",
              "path": "lessons/boya-quasi-intermediate-i/lesson-12/00-source/source-manifest.json"
            }
          ]
        },
        {
          "number": 2,
          "id": "teaching_design",
          "title": "PBI 教学重组",
          "description": "依该课核准实体课时建立流程、Can-Do 与练习 coverage。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 3,
          "id": "teacher_guide",
          "title": "教师手册内容母版",
          "description": "完成并批准可直接执行的教师手册。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 4,
          "id": "support_materials",
          "title": "预习卡与补充活动材料",
          "description": "完成预习卡、活动卡、评量表与 Exit Ticket。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 5,
          "id": "storyboard",
          "title": "PPT storyboard",
          "description": "逐页对应教材内容、学生动作、音档与课堂产出。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 6,
          "id": "visual_storyboard",
          "title": "Visual storyboard",
          "description": "确认版式、视觉用途、素材来源与学生画面文字上限。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 7,
          "id": "prototype",
          "title": "6 张视觉 prototype",
          "description": "确认学生画面方向、字级、留白与图片比例。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 8,
          "id": "pptx",
          "title": "完整原生 PPTX",
          "description": "完成可编辑、静态、16:9 的课堂 PPTX。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 9,
          "id": "audio_notes",
          "title": "音档与 speaker notes",
          "description": "完成音频嵌入、编号对应与 PowerPoint 播放测试。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 10,
          "id": "qa_rehearsal",
          "title": "内容 QA、技术 QA 与教师 rehearsal",
          "description": "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        },
        {
          "number": 11,
          "id": "release",
          "title": "不可变交付包",
          "description": "从 authority 建立 release，并完成版本与 hash 登记。",
          "status": "locked",
          "status_label": "锁定",
          "evidence": []
        }
      ],
      "file_groups": []
    }
  },
  "production_gates": {
    "teacher-guide": {
      "status": "blocked",
      "blockers": [
        "teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/teaching-design/manifest.json",
        "source gate is not verified",
        "source QA gate is not passed",
        "PBI teaching-design gate is not approved",
        "source package has unsupported status: 'active_source_pending_review'",
        "authority manifest source package differs from configured frozen input",
        "frozen source package tree hash mismatch",
        "frozen source package file count mismatch: manifest=None, actual=6"
      ]
    },
    "support": {
      "status": "blocked",
      "blockers": [
        "teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/teaching-design/manifest.json",
        "source gate is not verified",
        "source QA gate is not passed",
        "PBI teaching-design gate is not approved",
        "source package has unsupported status: 'active_source_pending_review'",
        "authority manifest source package differs from configured frozen input",
        "frozen source package tree hash mismatch",
        "frozen source package file count mismatch: manifest=None, actual=6",
        "authority manifest is not final_confirmed",
        "approved teacher manual is missing from 20-approved",
        "teacher manual is not marked final_confirmed",
        "authority hash mismatch: lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
        "authority byte count mismatch: lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx"
      ]
    },
    "prototype": {
      "status": "blocked",
      "blockers": [
        "teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/teaching-design/manifest.json",
        "source gate is not verified",
        "source QA gate is not passed",
        "PBI teaching-design gate is not approved",
        "source package has unsupported status: 'active_source_pending_review'",
        "authority manifest source package differs from configured frozen input",
        "frozen source package tree hash mismatch",
        "frozen source package file count mismatch: manifest=None, actual=6",
        "visual storyboard manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/visual-storyboard/manifest.json"
      ]
    },
    "pptx": {
      "status": "blocked",
      "blockers": [
        "teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/teaching-design/manifest.json",
        "source gate is not verified",
        "source QA gate is not passed",
        "PBI teaching-design gate is not approved",
        "source package has unsupported status: 'active_source_pending_review'",
        "authority manifest source package differs from configured frozen input",
        "frozen source package tree hash mismatch",
        "frozen source package file count mismatch: manifest=None, actual=6",
        "authority manifest is not final_confirmed",
        "approved teacher manual is missing from 20-approved",
        "teacher manual is not marked final_confirmed",
        "authority hash mismatch: lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
        "authority byte count mismatch: lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
        "PPTX design input manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/visual-storyboard/manifest.json"
      ]
    },
    "release": {
      "status": "blocked",
      "blockers": [
        "teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/teaching-design/manifest.json",
        "source gate is not verified",
        "source QA gate is not passed",
        "PBI teaching-design gate is not approved",
        "source package has unsupported status: 'active_source_pending_review'",
        "authority manifest source package differs from configured frozen input",
        "frozen source package tree hash mismatch",
        "frozen source package file count mismatch: manifest=None, actual=6",
        "authority manifest is not final_confirmed",
        "approved teacher manual is missing from 20-approved",
        "teacher manual is not marked final_confirmed",
        "authority hash mismatch: lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
        "authority byte count mismatch: lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx",
        "authority manifest is not final_confirmed",
        "approved teacher manual is missing from 20-approved",
        "teacher manual is not marked final_confirmed",
        "release design input manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/visual-storyboard/manifest.json",
        "current QA is not recorded as passed",
        "PPTX audio playback is not recorded as passed",
        "approved contact-hour teacher rehearsal is not passed"
      ]
    }
  }
};
