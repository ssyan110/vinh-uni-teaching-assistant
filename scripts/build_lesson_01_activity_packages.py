#!/usr/bin/env python3
"""Build separately shareable activity packages for Boya Lesson 1."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable, Sequence

from build_lesson_01_support_materials import (
    ACTIVITY_DIR,
    OUTPUT_ROOT,
    add_body,
    add_bulleted,
    add_form_table,
    add_heading,
    add_label_box,
    add_meta,
    add_numbered,
    add_title,
    new_document,
)
from production_gate import assert_ready


COURSE_TITLE = "第一课《中国人的姓名》"


def rel(path: Path) -> str:
    return str(path.relative_to(OUTPUT_ROOT))


def ensure_package(folder_name: str, activity_id: str, title: str,
                   periods: Sequence[str], time_text: str,
                   group_text: str) -> tuple[Path, dict, list[Path], list[Path]]:
    package_dir = ACTIVITY_DIR / folder_name
    package_dir.mkdir(parents=True, exist_ok=True)
    spec = {
        "activity_id": activity_id,
        "title": title,
        "periods": list(periods),
        "folder": rel(package_dir),
        "time": time_text,
        "grouping": group_text,
        "teacher_guide": None,
        "student_materials": [],
    }
    return package_dir, spec, [], []


def save_material(package_dir: Path, stem: str,
                  builder: Callable[[], object]) -> dict:
    package_dir.mkdir(parents=True, exist_ok=True)
    document = builder()
    docx_path = package_dir / f"{stem}.docx"
    document.save(docx_path)
    return {"stem": stem, "docx": docx_path}


def register_material(spec: dict, material: dict, name: str,
                      teacher_guide: bool = False) -> None:
    entry = {
        "name": name,
        "docx": rel(material["docx"]),
    }
    if teacher_guide:
        spec["teacher_guide"] = entry
    else:
        spec["student_materials"].append(entry)


def material_paths(material: dict, docx_paths: list[Path],
                   pdf_paths: list[Path]) -> None:
    docx_paths.append(material["docx"])


def card_document(title: str, subtitle: str = COURSE_TITLE):
    document = new_document()
    add_title(document, title, subtitle)
    return document


def teacher_guide_document(title: str, period: str, time_text: str,
                           group_text: str, materials: Sequence[str],
                           steps: Sequence[str], after_text: str,
                           fallback_text: str):
    document = card_document(title, f"{COURSE_TITLE} · 教师速用说明")
    add_meta(document, [
        ("使用时段", period),
        ("活动时间", time_text),
        ("分组方式", group_text),
    ])
    add_heading(document, "发放顺序", 1)
    add_numbered(document, steps)
    add_heading(document, "每组材料", 2)
    add_bulleted(document, list(materials))
    add_heading(document, "活动结束", 2)
    add_body(document, after_text)
    add_heading(document, "人数不足时", 2)
    add_body(document, fallback_text)
    return document


def role_card_document(title: str, task: str, steps: Sequence[str],
                       completion: str, subtitle: str):
    document = card_document(title, subtitle)
    add_label_box(document, "你的任务", task)
    add_heading(document, "活动中", 2)
    add_bulleted(document, list(steps))
    add_label_box(document, "完成条件", completion)
    return document


def build_activity_01() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "01-姓名访谈", "ACT-01", "姓名访谈", ["P1", "P2"],
        "每轮约 4 分钟", "三人一组，轮流换角色")

    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 01 · 姓名访谈 · 教师速用说明", "P1–P2", "每轮约 4 分钟",
            "三人一组：访谈者、回答者、观察者",
            [
                "角色卡：访谈者、回答者、观察者各一张；访谈问题和观察记录已经放在对应角色卡中",
            ],
            [
                "每组先拿三张角色卡；访谈者和观察者直接使用自己卡片中的问题和记录表。",
                "第一轮开始：访谈者先问，回答者回答，观察者记录。",
                "每轮结束后换角色，三个人都完成一次访谈。",
                "最后收回观察者角色卡，检查每位学生是否留下口语证据。",
            ],
            "观察者角色卡由教师收回，作为 P2 重做的依据。",
            "两人组时，一人先担任访谈者和观察者，下一轮交换；不取消回答和追问。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    interviewer = save_material(
        package_dir,
        "01-角色卡-访谈者",
        _activity_01_interviewer,
    )
    register_material(spec, interviewer, "角色卡：访谈者（含访谈问题）")
    material_paths(interviewer, docx_paths, pdf_paths)

    role_cards = [
        (
            "02-角色卡-回答者",
            "角色卡：回答者",
            "回答问题，并说出自己的姓名例子。",
            [
                "回答姓名的读音、意思或来历。",
                "说出一个自己的例子或故事。",
                "听不清时，可以请同伴再说一次。",
            ],
            "你回答了问题，也说出了一个自己的例子。",
        ),
    ]
    for stem, title, task, steps, completion in role_cards:
        material = save_material(
            package_dir,
            stem,
            lambda title=title, task=task, steps=steps, completion=completion: role_card_document(
                title, task, steps, completion, "活动 01 · 姓名访谈"),
        )
        register_material(spec, material, title)
        material_paths(material, docx_paths, pdf_paths)

    observer = save_material(
        package_dir,
        "03-角色卡-观察者",
        _activity_01_observer,
    )
    register_material(spec, observer, "角色卡：观察者（含观察记录）")
    material_paths(observer, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_01_interviewer():
    document = role_card_document(
        "角色卡：访谈者",
        "先问一个问题，再根据回答追问。",
        [
            "先问：“你的名字怎么读？”或“这个名字有什么意思？”",
            "听完回答以后，再问一个和回答有关的问题。",
            "听不清时，请说：“请再说一次。”",
        ],
        "你问了一个问题，并完成了一次追问。",
        "活动 01 · 姓名访谈",
    )
    add_heading(document, "访谈问题", 2)
    add_label_box(document, "三人一组", "访谈者先问，回答者回答，访谈者再追问。")
    add_form_table(document, ["先问", "再追问"], [
        ["你的名字怎么读？", "这个名字有什么意思？"],
        ["这个名字从哪里来？", "你喜欢这个名字吗？为什么？"],
        ["你的姓和名有什么故事？", "如果重新起名儿，你会怎么选？"],
    ], [4680, 4680], row_height=0.72)
    add_label_box(document, "说不清时", "请再说一次。请说慢一点。")
    return document


def _activity_01_observer():
    document = role_card_document(
        "角色卡：观察者",
        "观察同伴怎样提问和回答，只记录最有用的一点。",
        [
            "记录一个好的追问。",
            "记录一句需要再说一次的话。",
            "不要把所有错误都写下来。",
        ],
        "你记录了一点具体反馈，帮助同伴下一轮说得更清楚。",
        "活动 01 · 姓名访谈",
    )
    add_heading(document, "观察记录", 2)
    add_label_box(document, "观察者填写", "每轮只写一条具体反馈。")
    add_form_table(document, ["我听到的一个好问题", "这句话需要再说一次"],
                   [["", ""]], [4680, 4680], row_height=1.25)
    add_heading(document, "我想给的建议", 2)
    add_body(document, "____________________________________________________________")
    return document


def build_activity_02() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "02-起名儿公司", "ACT-02", "起名儿公司", ["P4"], "约 20 分钟",
        "三至四人一组")

    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 02 · 起名儿公司 · 教师速用说明", "P4", "约 20 分钟",
            "三至四人一组：客户、命名顾问、记录员、观察员",
            [
                "活动步骤卡一张",
                "角色卡四张；客户卡已经放在客户角色卡中，姓名提案已经放在命名顾问角色卡中",
            ],
            [
                "先发活动步骤卡，再发角色卡；客户打开客户角色卡，选择一张客户卡。",
                "客户卡不能给顾问看；顾问至少提问两个问题，记录员同步记录。",
                "命名顾问直接在自己的角色卡中填写姓名提案，完成后安排客户追问。",
                "提案完成后安排客户追问，再进行 90 秒小组呈现。",
            ],
            "收回角色卡；客户条件和姓名提案都在对应角色卡中，可以作为小组口语表现证据留存。",
            "三人组由记录员兼任观察员；若只有两人，记录员功能由教师或另一组代看。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    steps = save_material(package_dir, "01-活动步骤卡", _activity_02_steps)
    register_material(spec, steps, "活动步骤卡")
    material_paths(steps, docx_paths, pdf_paths)

    customer = save_material(package_dir, "02-角色卡-客户", _activity_02_customer_role_card)
    register_material(spec, customer, "角色卡：客户（含四张客户卡）")
    material_paths(customer, docx_paths, pdf_paths)

    consultant = save_material(package_dir, "03-角色卡-命名顾问", _activity_02_consultant_role_card)
    register_material(spec, consultant, "角色卡：命名顾问（含姓名提案）")
    material_paths(consultant, docx_paths, pdf_paths)

    role_cards = [
        (
            "04-角色卡-记录员",
            "角色卡：记录员",
            "记录客户的要求和小组最后的姓名提案。",
            [
                "写下客户最重视的两个条件和顾问问过的问题。",
                "记录顾问提出的姓名、读音、字义和两个理由。",
                "记录客户的接受或修改要求，把最后结果写在命名顾问角色卡的“姓名提案”处。",
            ],
            "命名顾问角色卡中的“姓名提案”内容完整，小组可以用它准备 90 秒呈现。",
        ),
        (
            "05-角色卡-观察员",
            "角色卡：观察员",
            "观察小组怎样提问、回答和提出姓名。",
            [
                "检查顾问有没有问至少两个问题。",
                "检查顾问有没有说明读音、字义和两个理由。",
                "检查客户有没有回答追问；选一句话准备重做。",
            ],
            "你能说出一个做得好的地方，并选一句话和小组重做。",
        ),
    ]
    for stem, title, task, card_steps, completion in role_cards:
        material = save_material(
            package_dir,
            stem,
            lambda title=title, task=task, card_steps=card_steps, completion=completion: role_card_document(
                title, task, card_steps, completion, "活动 02 · 起名儿公司"),
        )
        register_material(spec, material, title)
        material_paths(material, docx_paths, pdf_paths)

    return spec, docx_paths, pdf_paths


def _activity_02_steps():
    document = card_document("活动 02 · 起名儿公司 · 活动步骤", "活动 02 · 起名儿公司")
    add_label_box(document, "任务", "三至四人一组 · 先问清楚，再提出姓名")
    add_numbered(document, [
        "客户拿一张客户卡，先自己读懂要求，圈出最重要的两个条件。客户卡先不给顾问看。",
        "顾问先问至少两个问题。客户根据客户卡回答；如果顾问没有问到重要条件，客户可以补充。",
        "记录员在命名顾问角色卡的“姓名提案”处写下客户的条件和小组最后的提案。",
        "客户听完提案后，可以接受，也可以提出修改要求；最后问顾问一个问题。",
        "小组使用命名顾问角色卡中的“姓名提案”准备 90 秒小组呈现。",
    ])
    add_label_box(document, "开始前", "先分角色，再抽一张客户卡；每组使用一张客户卡完成一次提案。")
    return document


def _activity_02_customer_role_card():
    document = role_card_document(
        "角色卡：客户",
        "先打开下面的一张客户卡，读懂要求，圈出两个最重要的条件。",
        [
            "客户卡先不给顾问看，让顾问通过提问了解你的条件。",
            "根据客户卡回答顾问的问题；没有问到重要条件时，可以补充。",
            "听完姓名提案后，可以接受，也可以提出修改要求。",
            "最后问顾问一个问题。",
        ],
        "顾问知道你的两个重要条件，你提出一个追问。",
        "活动 02 · 起名儿公司",
    )
    add_heading(document, "客户卡", 1)
    customer_cards = [
        ("客户卡一：明亮的名字", "我想给女儿起一个两个字的名字。名字要让人想到阳光、春天或希望，读起来要容易。"),
        ("客户卡二：有力量的名字", "我想给儿子起一个名字。名字可以表示勇敢、努力或责任，但是不要太夸张，也不要太难读。"),
        ("客户卡三：和自然有关的名字", "我希望孩子的名字和水、山、树或天空有关。名字可以有一个字，也可以有两个字；我更重视字的意思。"),
        ("客户卡四：容易介绍的名字", "我希望孩子的名字容易读、容易写，也容易向不同国家的人介绍。名字要有友好、快乐或平安的意思。"),
    ]
    for index, (title, brief) in enumerate(customer_cards):
        if index:
            document.add_page_break()
        add_heading(document, title, 1)
        add_body(document, brief)
        add_label_box(document, "客户先做", "先自己读懂这张卡，圈出两个最重要的条件。不要把卡给顾问看，等顾问提问。")
        add_form_table(document, ["客户最重视的条件", "顾问要继续问什么"],
                       [["", ""]], [4680, 4680], row_height=1.15)
    return document


def _activity_02_consultant_role_card():
    document = role_card_document(
        "角色卡：命名顾问",
        "先问清楚客户想要什么，再提出一个合适的姓名。",
        [
            "至少问客户两个问题，不要马上猜姓名。",
            "提出姓名，并说明怎么读、字的意思和两个理由。",
            "听到客户的追问后，回答问题；必要时修改提案。",
        ],
        "你提出一个姓名，说清楚读音、字义和两个理由。",
        "活动 02 · 起名儿公司",
    )
    add_heading(document, "姓名提案", 1)
    add_label_box(document, "记录员填写", "记录最后的姓名、读音、字的意思、两个理由和客户的追问。")
    add_form_table(document, ["姓名", "怎么读", "字的意思", "两个理由", "客户的追问"],
                   [["", "", "", "", ""]],
                   [1700, 1500, 1900, 2600, 1660], row_height=1.2)
    add_heading(document, "小组呈现前", 2)
    add_body(document, "我们最后选择这个姓名，因为：________________________________________")
    return document


def build_activity_03() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "03-电影演员中文名", "ACT-03", "电影演员中文名", ["P4"], "约 10 分钟",
        "四人一组")
    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 03 · 电影演员中文名 · 教师速用说明", "P4", "约 10 分钟",
            "四人一组",
            ["演员卡甲、乙、丙和小组呈现卡（同一份 Word）"],
            [
                "每组使用同一份 Word，先完成演员卡甲、乙、丙。",
                "小组选择其中两个名字，继续完成文件中的小组呈现卡。",
                "每组完成 60 秒呈现，其他小组提出一个问题。",
            ],
            "收回这份 Word，作为 P4 口语表现记录。",
            "三人组时，一名学生负责两张演员卡；仍然保留两个名字的理由。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    combined = save_material(package_dir, "01-演员卡与小组呈现卡", _activity_03_combined_cards)
    register_material(spec, combined, "演员卡甲、乙、丙与小组呈现卡")
    material_paths(combined, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_03_combined_cards():
    document = card_document("活动 03 · 演员卡与小组呈现卡", "活动 03 · 电影演员中文名")
    add_label_box(document, "使用方法", "同一份 Word 包括演员卡甲、乙、丙和小组呈现卡。按顺序完成。")
    for index, label in enumerate(("甲", "乙", "丙")):
        document.add_page_break()
        add_heading(document, f"演员卡 {label}", 1)
        add_label_box(document, "小组任务", "根据原名或声音和意思，提出一个中文名。")
        add_form_table(document, ["原名或声音", "你想到的意思", "中文名", "理由"],
                       [["", "", "", ""]], [2300, 2300, 2300, 2460], row_height=1.8)
        add_label_box(document, "说一说", "这个名字怎么读？它有什么意思？为什么这样选？")
    document.add_page_break()
    add_heading(document, "小组呈现卡", 1)
    add_label_box(document, "呈现时间", "约 60 秒；选择两个名字，说明读音、意思和理由。")
    add_form_table(document, ["我们选择的两个名字", "读音和意思", "同伴的问题", "我们的回答"],
                   [["", "", "", ""]], [2300, 2500, 2200, 2360], row_height=1.25)
    return document


def build_activity_04() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "04-姓氏信息站", "ACT-04", "姓氏信息站", ["P6"], "按课本练习使用",
        "两人一组")
    for stale_stem in [
        "03-课文资料卡A",
        "04-课文资料卡B",
        "05-课文资料卡C",
        "06-课文资料卡D",
    ]:
        stale_path = package_dir / f"{stale_stem}.docx"
        if stale_path.exists():
            stale_path.unlink()
    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 04 · 姓氏信息站 · 教师速用说明", "P6", "按课本练习使用",
            "两人一组",
            [
                "01-句式任务卡一张",
                "02-文化比较卡一张",
                "03-课文重点记录卡一张",
                "07-姓氏读法卡一张",
                "08-对话总结记录一张",
            ],
            [
                "按照 PPT 当前页面，只发当前需要的一张卡，不要一次发完全部材料。",
                "所有卡片都使用两人一组；一人说，另一人回答或记录，然后交换。",
                "03 先阅读短文，每个人写下一个重点；再轮流说给同伴听，同伴记录在“我听到的重点”表格里。",
                "08 使用两人一组；先共同写下对话重点，再轮流练习报告。",
                "活动结束后保留记录，作为听说练习的过程证据。",
            ],
            "五组材料继续分开保存；下次按活动名称直接发放，不需要裁切。",
            "如果需要三人一组，一人负责记录；课文重点记录仍然先两人互说，再交换记录。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    station1 = save_material(package_dir, "01-句式任务卡", _activity_04_station1)
    register_material(spec, station1, "句式任务卡")
    material_paths(station1, docx_paths, pdf_paths)

    station2 = save_material(package_dir, "02-文化比较卡", _activity_04_station2)
    register_material(spec, station2, "文化比较卡")
    material_paths(station2, docx_paths, pdf_paths)

    reading = save_material(package_dir, "03-课文重点记录卡", _activity_04_reading_summary)
    register_material(spec, reading, "课文重点记录卡")
    material_paths(reading, docx_paths, pdf_paths)

    station4 = save_material(package_dir, "07-姓氏读法卡", _activity_04_station4)
    register_material(spec, station4, "姓氏读法卡")
    material_paths(station4, docx_paths, pdf_paths)

    summary = save_material(package_dir, "08-对话总结记录", _activity_04_dialogue_summary)
    register_material(spec, summary, "对话总结记录")
    material_paths(summary, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_04_station1():
    document = card_document("活动 04 · 句式任务卡", "活动 04 · 姓氏信息站")
    add_label_box(document, "两人一组", "先完成课本句式练习，再用这张卡说给同学听。说完交换。")
    add_form_table(document, ["句式", "你要说", "同学要做"], [
        ["不然", "先说应该做什么，再说不这样会怎么样。", "回答：如果不这样做，会怎么样？"],
        ["是……还是……", "提出两个选择。", "直接选一个。"],
        ["怎么……怎么……", "说不管怎么做，结果都一样。", "说出：哪一种做法，结果都一样。"],
    ], [1900, 3900, 3560], row_height=0.92)
    add_label_box(document, "完成", "每个人说三句话，同学完成三次回答。")
    return document


def _activity_04_station2():
    document = card_document("活动 04 · 文化比较卡", "活动 04 · 姓氏信息站")
    add_label_box(document, "两人一组", "先说自己国家的情况，再说中国的情况。最后写一个相同点或不同点。")
    add_form_table(document, ["课本问题", "我说", "同学记下"], [
        ["中国人的姓名是姓在前、名在后，你们国家呢？", "", ""],
        ["在你们国家，人的姓名是什么时候产生的？", "", ""],
    ], [3900, 2700, 2760], row_height=1.05)
    add_label_box(document, "我们发现", "我们和中国的姓名有一个相同点／不同点：____________________________")
    return document


def _activity_04_reading_summary():
    document = card_document("活动 04 · 课文重点记录卡", "文化知识 · 阅读短文《中国人的姓名》")
    add_label_box(document, "两人一组", "先阅读短文，每个人写下一个重点。然后轮流说给同伴听，同伴记录在下面的表格里。")
    add_heading(document, "课文短文", 2)
    add_body(document, (
        "中国人的姓大多是单姓，如张、王、李、刘等，也有少数人是复姓，如司马、欧阳、诸葛、上官等。\n"
        "中国人姓的来历，主要有以下几种：一是以古代的国名或地名为姓，如齐、鲁、宋、郑、吴、秦、赵、陈等，都是今天常见的姓；二是以古代的官名为姓，如司马、司徒、上官等；还有以职业、技艺为姓，如陶等。\n"
        "中国流行的《百家姓》是北宋时期成书的，里面收集了411个姓氏，后增补到504个，单姓444个，复姓60个。其中张、王、李、赵、陈、杨、吴、刘、黄、周，这10个姓占人口的40%。"
    ))
    add_form_table(document, ["我写下的重点"], [[""]], [9360], row_height=0.85)
    add_form_table(document, ["我听到的重点"], [["1. ________________________________\n2. ________________________________\n3. ________________________________"]], [9360], row_height=1.1)
    return document


def _activity_04_station4():
    document = card_document("活动 04 · 姓氏读法卡", "活动 04 · 姓氏信息站")
    add_label_box(document, "两人一组", "从课本的单姓和复姓中选择五个。一个人读，另一个人写下听到的姓，然后交换。")
    add_form_table(document, ["A读五个姓，B记录"], [["1. __________　 2. __________　 3. __________\n4. __________　 5. __________"]], [9360], row_height=0.9)
    add_form_table(document, ["B读五个姓，A记录"], [["1. __________　 2. __________　 3. __________\n4. __________　 5. __________"]], [9360], row_height=0.9)
    add_label_box(document, "读完以后", "你认识有这些姓的人吗？　认识／不认识")
    add_body(document, "课本姓氏：赵、钱、孙、李、周、吴、郑、王、司马、上官、欧阳、诸葛等。")
    return document


def _activity_04_dialogue_summary():
    document = card_document("活动 04 · 对话总结记录", "活动 04 · 姓氏信息站")
    add_label_box(document, "两人一组", "先读课本对话，写下重点。然后一人报告，另一人听。说完交换。")
    add_form_table(document, ["对话重点", "我们的记录"], [
        ["A发现了什么规律？", ""],
        ["B遇到了什么麻烦？", ""],
        ["最后发生了什么？", ""],
    ], [3300, 6060], row_height=0.9)
    add_label_box(document, "总结", "用五句话说清楚对话内容。")
    add_form_table(document, ["我们的五句话"], [["1.\n2.\n3.\n4.\n5."]], [9360], row_height=1.35)
    add_heading(document, "同伴提问与回答", 2, page_break_before=True)
    add_form_table(
        document,
        ["同伴的问题", "我的回答"],
        [["\n\n\n", "\n\n\n"]],
        [4680, 4680],
        row_height=1.65,
    )
    add_label_box(document, "完成", "两个人都完成一次总结报告，并回答同伴的一个问题。")
    return document


def build_activity_05() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "05-调查与研究", "ACT-05", "调查与研究", ["P4", "P6"], "分类约 10 分钟；人物介绍约 5 分钟",
        "四人一组")
    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 05 · 调查与研究 · 教师速用说明", "P4、P6", "分类约 10 分钟；人物介绍约 5 分钟",
            "四人一组",
            ["姓名分类表一张", "小组报告大纲一张"],
            [
                "P4 使用姓名分类表，把课本给出的姓名填入三类。",
                "P6 使用小组报告大纲，每个人准备一位历史人物。",
                "小组完成报告，其他小组提出一个问题。",
                "在报告大纲上完成检查，再根据反馈重说一句。",
            ],
            "收回姓名分类表和报告大纲，作为 P4、P6 口语任务的过程证据。",
            "若学生资料不足，先使用课本给出的姓名或历史人物资料；报告仍要说明一个理由。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    survey = save_material(package_dir, "01-姓名调查表", _activity_05_survey)
    register_material(spec, survey, "姓名调查表")
    material_paths(survey, docx_paths, pdf_paths)

    report = save_material(package_dir, "02-小组报告大纲", _activity_05_report)
    register_material(spec, report, "小组报告大纲")
    material_paths(report, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_05_survey():
    document = card_document("活动 05 · 姓名分类表", "活动 05 · 调查与研究")
    add_label_box(document, "课本练习", "把下面的姓名填入三类。先向同学了解一个姓名的意思，再分类。")
    add_form_table(document, ["课本给出的姓名"], [[
        "梁开放　余胜男　吴建国　李小龙　于国庆\n"
        "康有为　王豫　苏东坡　孙湘　郑板桥\n"
        "刘为民　郑成功　王沪生　陈招娣　钱卫东"
    ]], [9360], row_height=0.98)
    add_form_table(document, ["注重时代意义", "具有地域特点", "体现美好愿望"], [[
        "1. __________________\n2. __________________\n3. __________________\n4. __________________\n5. __________________",
        "1. __________________\n2. __________________\n3. __________________\n4. __________________\n5. __________________",
        "1. __________________\n2. __________________\n3. __________________\n4. __________________\n5. __________________",
    ]], [3120, 3120, 3120], row_height=1.55)
    return document


def _activity_05_report():
    document = card_document("活动 05 · 小组报告大纲", "活动 05 · 调查与研究")
    add_label_box(document, "报告时间", "约 2 分钟；每个人至少说一句话。")
    add_form_table(document, ["部分", "我们的内容"], [
        ["开头：我们调查了什么", ""],
        ["发现一：一个名字和理由", ""],
        ["发现二：一个比较或例子", ""],
        ["结尾：我们的观察", ""],
        ["同伴可能问的问题", ""],
    ], [2600, 6760], row_height=0.58)
    add_label_box(document, "完成检查", "报告前一起确认：")
    add_form_table(document, ["请勾选"], [[
        "□ 我们有资料。\n"
        "□ 我们有具体例子。\n"
        "□ 我们说明了理由。\n"
        "□ 每个人都有一句话要说。\n"
        "□ 我们回答了同伴的问题。"
    ]], [9360], row_height=1.08)
    return document


def build_activity_index(specs: Sequence[dict]) -> Path:
    document = card_document("第一课活动材料索引", f"{COURSE_TITLE} · 教师使用")
    add_body(document, "课堂使用时，先打开对应活动资料夹，直接打开需要的 Word 文件。", after=4)
    add_heading(document, "按节次找资料", 1)
    rows = []
    for spec in specs:
        materials = "、".join(item["name"] for item in spec["student_materials"][:3])
        if len(spec["student_materials"]) > 3:
            materials += "等"
        rows.append([
            "、".join(spec["periods"]),
            spec["title"],
            spec["folder"].split("/", 1)[-1],
            materials,
        ])
    add_form_table(document, ["节次", "活动", "资料夹", "先发材料"], rows,
                   [1300, 1900, 2600, 3560], row_height=0.48)
    add_label_box(document, "发放方法", "先看教师速用说明，再打开对应的 Word 文件；同一活动的材料放在同一资料夹，不需要裁切。")
    material = save_material(ACTIVITY_DIR, "00-第一课活动材料索引", lambda: document)
    return material["docx"]


def build_all() -> tuple[list[Path], list[dict], Path]:
    assert_ready("support", OUTPUT_ROOT)
    results = [
        build_activity_01(),
        build_activity_02(),
        build_activity_03(),
        build_activity_04(),
        build_activity_05(),
    ]
    specs = [result[0] for result in results]
    docx_paths = [path for result in results for path in result[1]]
    pdf_paths = [path for result in results for path in result[2]]
    if pdf_paths:
        raise RuntimeError("Activity-card PDF generation is disabled; DOCX is the only activity format.")
    index_docx = build_activity_index(specs)
    docx_paths.insert(0, index_docx)

    package_manifest = {
        "package": "boya-intermediate-lesson-01-activity-packages",
        "layout": "one_standalone_editable_docx_per_material_in_activity_folder",
        "language": "简体中文",
        "activities": specs,
        "index": {
            "docx": rel(index_docx),
        },
    }
    manifest_path = ACTIVITY_DIR / "activity-package-manifest.json"
    manifest_path.write_text(json.dumps(package_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return docx_paths, specs, manifest_path


if __name__ == "__main__":
    generated_docx, specs, manifest = build_all()
    print(json.dumps({
        "docx_count": len(generated_docx),
        "pdf_count": 0,
        "manifest": str(manifest),
    }, ensure_ascii=False, indent=2))
