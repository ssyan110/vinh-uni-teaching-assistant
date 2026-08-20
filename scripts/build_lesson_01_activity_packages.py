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


COURSE_TITLE = "第一课《中国人的姓名》"


def rel(path: Path) -> str:
    return str(path.relative_to(OUTPUT_ROOT))


def ensure_package(folder_name: str, activity_id: str, title: str,
                   periods: Sequence[str], time_text: str,
                   group_text: str) -> tuple[Path, dict, list[Path], list[Path]]:
    package_dir = ACTIVITY_DIR / folder_name
    editable_dir = package_dir / "可编辑原稿"
    editable_dir.mkdir(parents=True, exist_ok=True)
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
    editable_dir = package_dir / "可编辑原稿"
    editable_dir.mkdir(parents=True, exist_ok=True)
    document = builder()
    docx_path = editable_dir / f"{stem}.docx"
    document.save(docx_path)
    pdf_path = package_dir / f"{stem}.pdf"
    return {"stem": stem, "docx": docx_path, "pdf": pdf_path}


def register_material(spec: dict, material: dict, name: str,
                      teacher_guide: bool = False) -> None:
    entry = {
        "name": name,
        "pdf": rel(material["pdf"]),
        "docx": rel(material["docx"]),
    }
    if teacher_guide:
        spec["teacher_guide"] = entry
    else:
        spec["student_materials"].append(entry)


def material_paths(material: dict, docx_paths: list[Path],
                   pdf_paths: list[Path]) -> None:
    docx_paths.append(material["docx"])
    pdf_paths.append(material["pdf"])


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
                "角色卡：访谈者、回答者、观察者各一张",
                "访谈问题卡一张",
                "观察记录卡一张",
            ],
            [
                "每组先拿三张角色卡，学生坐好后再发访谈问题卡。",
                "第一轮开始：访谈者先问，回答者回答，观察者记录。",
                "每轮结束后换角色，三个人都完成一次访谈。",
                "最后收回观察记录卡，检查每位学生是否留下口语证据。",
            ],
            "访谈问题卡可以留在小组；观察记录卡由教师收回，作为 P2 重做的依据。",
            "两人组时，一人先担任访谈者和观察者，下一轮交换；不取消回答和追问。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    role_cards = [
        (
            "01-角色卡-访谈者",
            "角色卡：访谈者",
            "先问一个问题，再根据回答追问。",
            [
                "先问：“你的名字怎么读？”或“这个名字有什么意思？”",
                "听完回答以后，再问一个和回答有关的问题。",
                "听不清时，请说：“请再说一次。”",
            ],
            "你问了一个问题，并完成了一次追问。",
        ),
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
        (
            "03-角色卡-观察者",
            "角色卡：观察者",
            "观察同伴怎样提问和回答，只记录最有用的一点。",
            [
                "记录一个好的追问。",
                "记录一句需要再说一次的话。",
                "不要把所有错误都写下来。",
            ],
            "你记录了一点具体反馈，帮助同伴下一轮说得更清楚。",
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

    questions = save_material(
        package_dir,
        "04-访谈问题卡",
        lambda: _activity_01_questions(),
    )
    register_material(spec, questions, "访谈问题卡")
    material_paths(questions, docx_paths, pdf_paths)

    observation = save_material(
        package_dir,
        "05-观察记录卡",
        lambda: _activity_01_observation(),
    )
    register_material(spec, observation, "观察记录卡")
    material_paths(observation, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_01_questions():
    document = card_document("活动 01 · 访谈问题卡", "活动 01 · 姓名访谈")
    add_label_box(document, "三人一组", "访谈者先问，回答者回答，访谈者再追问。")
    add_form_table(document, ["先问", "再追问"], [
        ["你的名字怎么读？", "这个名字有什么意思？"],
        ["这个名字从哪里来？", "你喜欢这个名字吗？为什么？"],
        ["你的姓和名有什么故事？", "如果重新起名儿，你会怎么选？"],
    ], [4680, 4680], row_height=0.72)
    add_label_box(document, "说不清时", "请再说一次。请说慢一点。")
    return document


def _activity_01_observation():
    document = card_document("活动 01 · 观察记录卡", "活动 01 · 姓名访谈")
    add_label_box(document, "观察者填写", "每轮只写一条具体反馈。")
    add_form_table(document, ["我听到的一个好问题", "这句话需要再说一次"],
                   [["", ""]], [4680, 4680], row_height=1.25)
    add_heading(document, "换角色前说一句", 2)
    add_body(document, "我建议你下一轮：____________________________________________")
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
                "角色卡四张；三人组时记录员兼观察员",
                "每组客户卡一张，从四张客户卡中选择",
                "姓名提案卡一张",
            ],
            [
                "先发活动步骤卡，说明客户卡不能给顾问看。",
                "再发角色卡，学生确认分工后抽取一张客户卡。",
                "顾问至少提问两个问题，记录员同步填写提案卡。",
                "提案完成后安排客户追问，再进行 90 秒小组呈现。",
            ],
            "收回角色卡和客户卡；姓名提案卡可以作为小组口语表现证据留存。",
            "三人组由记录员兼任观察员；若只有两人，记录员功能由教师或另一组代看。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    steps = save_material(package_dir, "01-活动步骤卡", _activity_02_steps)
    register_material(spec, steps, "活动步骤卡")
    material_paths(steps, docx_paths, pdf_paths)

    role_cards = [
        (
            "02-角色卡-客户",
            "角色卡：客户",
            "先拿一张客户卡，读懂要求，圈出两个最重要的条件。",
            [
                "客户卡先不给顾问看，让顾问通过提问了解你的条件。",
                "根据客户卡回答顾问的问题；没有问到重要条件时，可以补充。",
                "听完姓名提案后，可以接受，也可以提出修改要求。",
                "最后问顾问一个问题。",
            ],
            "顾问知道你的两个重要条件，你提出一个追问。",
        ),
        (
            "03-角色卡-命名顾问",
            "角色卡：命名顾问",
            "先问清楚客户想要什么，再提出一个合适的姓名。",
            [
                "至少问客户两个问题，不要马上猜姓名。",
                "提出姓名，并说明怎么读、字的意思和两个理由。",
                "听到客户的追问后，回答问题；必要时修改提案。",
            ],
            "你提出一个姓名，说清楚读音、字义和两个理由。",
        ),
        (
            "04-角色卡-记录员",
            "角色卡：记录员",
            "记录客户的要求和小组最后的姓名提案。",
            [
                "写下客户最重视的两个条件和顾问问过的问题。",
                "记录顾问提出的姓名、读音、字义和两个理由。",
                "记录客户的接受或修改要求，把最后结果写在“姓名提案卡”上。",
            ],
            "姓名提案卡内容完整，小组可以用它准备 90 秒呈现。",
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

    customers = [
        (
            "06-客户卡-明亮的名字",
            "客户卡一：明亮的名字",
            "我想给女儿起一个两个字的名字。名字要让人想到阳光、春天或希望，读起来要容易。",
        ),
        (
            "07-客户卡-有力量的名字",
            "客户卡二：有力量的名字",
            "我想给儿子起一个名字。名字可以表示勇敢、努力或责任，但是不要太夸张，也不要太难读。",
        ),
        (
            "08-客户卡-和自然有关的名字",
            "客户卡三：和自然有关的名字",
            "我希望孩子的名字和水、山、树或天空有关。名字可以有一个字，也可以有两个字；我更重视字的意思。",
        ),
        (
            "09-客户卡-容易介绍的名字",
            "客户卡四：容易介绍的名字",
            "我希望孩子的名字容易读、容易写，也容易向不同国家的人介绍。名字要有友好、快乐或平安的意思。",
        ),
    ]
    for stem, title, brief in customers:
        material = save_material(
            package_dir,
            stem,
            lambda title=title, brief=brief: _activity_02_customer_card(title, brief),
        )
        register_material(spec, material, title)
        material_paths(material, docx_paths, pdf_paths)

    proposal = save_material(package_dir, "10-姓名提案卡", _activity_02_proposal)
    register_material(spec, proposal, "姓名提案卡")
    material_paths(proposal, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_02_steps():
    document = card_document("活动 02 · 起名儿公司 · 活动步骤", "活动 02 · 起名儿公司")
    add_label_box(document, "任务", "三至四人一组 · 先问清楚，再提出姓名")
    add_numbered(document, [
        "客户拿一张客户卡，先自己读懂要求，圈出最重要的两个条件。客户卡先不给顾问看。",
        "顾问先问至少两个问题。客户根据客户卡回答；如果顾问没有问到重要条件，客户可以补充。",
        "记录员写下客户的条件。顾问根据回答提出一个姓名，并说明读音、字义和两个理由。",
        "客户听完提案后，可以接受，也可以提出修改要求；最后问顾问一个问题。",
        "小组把最后的姓名写在“姓名提案卡”上，准备 90 秒小组呈现。",
    ])
    add_label_box(document, "开始前", "先分角色，再抽一张客户卡；每组使用一张客户卡完成一次提案。")
    return document


def _activity_02_customer_card(title: str, brief: str):
    document = card_document(title, "活动 02 · 起名儿公司")
    add_body(document, brief)
    add_label_box(document, "客户先做", "先自己读懂这张卡，圈出两个最重要的条件。不要把卡给顾问看，等顾问提问。")
    add_form_table(document, ["客户最重视的条件", "顾问要继续问什么"],
                   [["", ""]], [4680, 4680], row_height=1.15)
    return document


def _activity_02_proposal():
    document = card_document("活动 02 · 姓名提案卡", "活动 02 · 起名儿公司")
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
            ["演员卡甲、乙、丙各一张", "小组呈现卡一张"],
            [
                "每组先发三张演员卡，学生分别记录声音、意思和中文名。",
                "小组选择其中两个名字，填写小组呈现卡。",
                "每组完成 60 秒呈现，其他小组提出一个问题。",
            ],
            "收回演员卡；小组呈现卡可以并入 P4 口语表现记录。",
            "三人组时，一名学生负责两张演员卡；仍然保留两个名字的理由。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    for index, label in enumerate(("甲", "乙", "丙"), start=1):
        material = save_material(
            package_dir,
            f"{index:02d}-演员卡-{label}",
            lambda label=label: _activity_03_actor_card(label),
        )
        register_material(spec, material, f"演员卡 {label}")
        material_paths(material, docx_paths, pdf_paths)

    presentation = save_material(package_dir, "04-小组呈现卡", _activity_03_presentation)
    register_material(spec, presentation, "小组呈现卡")
    material_paths(presentation, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_03_actor_card(label: str):
    document = card_document(f"活动 03 · 演员卡 {label}", "活动 03 · 电影演员中文名")
    add_label_box(document, "小组任务", "根据原名或声音和意思，提出一个中文名。")
    add_form_table(document, ["原名或声音", "你想到的意思", "中文名", "理由"],
                   [["", "", "", ""]], [2300, 2300, 2300, 2460], row_height=1.8)
    add_label_box(document, "说一说", "这个名字怎么读？它有什么意思？为什么这样选？")
    return document


def _activity_03_presentation():
    document = card_document("活动 03 · 小组呈现卡", "活动 03 · 电影演员中文名")
    add_label_box(document, "呈现时间", "约 60 秒；选择两个名字，说明读音、意思和理由。")
    add_form_table(document, ["我们选择的两个名字", "读音和意思", "同伴的问题", "我们的回答"],
                   [["", "", "", ""]], [2300, 2500, 2200, 2360], row_height=1.25)
    return document


def build_activity_04() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "04-姓氏信息站", "ACT-04", "姓氏信息站", ["P6"], "每站约 6 分钟",
        "三人一组，轮站完成")
    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 04 · 姓氏信息站 · 教师速用说明", "P6", "每站约 6 分钟",
            "三人一组，按站点轮换",
            [
                "第一站：句式信息交换卡一张",
                "第二站：文化比较卡一张",
                "第三站：资料卡 A、B、C、D 各一张",
                "第四站：朗读与人物研究卡一张",
            ],
            [
                "按第一站到第四站摆放材料，每站只放当前需要的卡。",
                "每站开始时，学生先提问，再把资料告诉同伴。",
                "听到铃声后轮换；每个人都要在至少两站开口说话。",
                "最后收回各站记录卡，保留学生的研究资料。",
            ],
            "将四站材料分袋保存，下次可以直接按站点重新发放。",
            "两人组时两站合并；教师保留第四站人物介绍作为个人口语证据。",
        ),
    )
    register_material(spec, guide, "教师速用说明", teacher_guide=True)
    material_paths(guide, docx_paths, pdf_paths)

    station1 = save_material(package_dir, "01-第一站-句式信息交换", _activity_04_station1)
    register_material(spec, station1, "第一站：句式信息交换")
    material_paths(station1, docx_paths, pdf_paths)

    station2 = save_material(package_dir, "02-第二站-文化比较", _activity_04_station2)
    register_material(spec, station2, "第二站：文化比较")
    material_paths(station2, docx_paths, pdf_paths)

    data_cards = [
        ("A", "中国人的姓大多是单姓。张、王、李、刘是常见的姓。"),
        ("B", "有些人的姓是复姓，例如司马、欧阳、诸葛、上官。"),
        ("C", "有些姓和古代的国名、地名或官名有关系。"),
        ("D", "《百家姓》收集了很多姓氏。不同姓氏的人都可以有自己的故事。"),
    ]
    for index, (label, text) in enumerate(data_cards, start=3):
        material = save_material(
            package_dir,
            f"{index:02d}-第三站-资料卡{label}",
            lambda label=label, text=text: _activity_04_data_card(label, text),
        )
        register_material(spec, material, f"第三站：资料卡 {label}")
        material_paths(material, docx_paths, pdf_paths)

    station4 = save_material(package_dir, "07-第四站-朗读与人物研究", _activity_04_station4)
    register_material(spec, station4, "第四站：朗读与人物研究")
    material_paths(station4, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_04_station1():
    document = card_document("活动 04 · 第一站：句式信息交换", "活动 04 · 姓氏信息站")
    add_label_box(document, "先问清楚", "每个人拿到不同的姓氏资料，再把资料告诉同伴。")
    add_form_table(document, ["我的资料", "我问同伴", "我听到的资料"], [
        ["姓：________\n单姓／复姓：________", "这是单姓还是复姓？", ""],
        ["姓名顺序：________\n一个特点：________", "你们国家呢？", ""],
        ["一个想比较的地方：________", "你同意吗？为什么？", ""],
    ], [2900, 3000, 3460], row_height=0.78)
    return document


def _activity_04_station2():
    document = card_document("活动 04 · 第二站：文化比较", "活动 04 · 姓氏信息站")
    add_label_box(document, "比较方法", "先说本国资料，再和同伴比较中国姓名。要说出一个具体例子。")
    add_form_table(document, ["比较项目", "本国", "中国", "我的问题"], [
        ["姓和名的顺序", "", "姓在前，名在后", ""],
        ["常见的姓", "", "张、王、李、刘等", ""],
        ["单姓／复姓", "", "两种都有", ""],
    ], [2200, 2300, 2700, 2160], row_height=0.72)
    return document


def _activity_04_data_card(label: str, text: str):
    document = card_document(f"活动 04 · 第三站：资料卡 {label}", "活动 04 · 姓氏信息站")
    add_label_box(document, "读一读", "找出一个重点，再用自己的话教给新小组。")
    add_body(document, text)
    add_form_table(document, ["我教给小组的重点"], [[""]], [9360], row_height=2.2)
    add_label_box(document, "可以这样说", "因为……所以……　／　例如……")
    return document


def _activity_04_station4():
    document = card_document("活动 04 · 第四站：朗读与人物研究", "活动 04 · 姓氏信息站")
    add_label_box(document, "先读，再说", "朗读下面的姓，再介绍一位历史人物。听者提出一个问题。")
    add_form_table(document, ["单姓", "复姓", "历史人物的姓", "同伴的问题"], [[
        "张、王、李、刘\n________________",
        "司马、欧阳、诸葛、上官\n________________",
        "",
        "",
    ]], [2350, 2550, 2300, 2160], row_height=1.25)
    return document


def build_activity_05() -> tuple[dict, list[Path], list[Path]]:
    package_dir, spec, docx_paths, pdf_paths = ensure_package(
        "05-调查与研究", "ACT-05", "调查与研究", ["P4"], "约 10 分钟",
        "四人一组")
    guide = save_material(
        package_dir,
        "00-教师速用说明",
        lambda: teacher_guide_document(
            "活动 05 · 调查与研究 · 教师速用说明", "P4", "约 10 分钟",
            "四人一组",
            ["姓名调查表一张", "小组报告大纲一张", "完成检查卡一张"],
            [
                "先把预习或访谈资料按三类意思分类。",
                "小组选择两个例子，填写报告大纲。",
                "完成 2 分钟报告，其他小组提出一个问题。",
                "根据反馈重说一句，再完成检查卡。",
            ],
            "收回姓名调查表和报告大纲，作为 P4 口语任务的过程证据。",
            "若学生资料不足，使用同伴已经准备好的例子；报告仍要说明一个理由。",
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

    check = save_material(package_dir, "03-完成检查", _activity_05_check)
    register_material(spec, check, "完成检查")
    material_paths(check, docx_paths, pdf_paths)
    return spec, docx_paths, pdf_paths


def _activity_05_survey():
    document = card_document("活动 05 · 姓名调查表", "活动 05 · 调查与研究")
    add_label_box(document, "姓名调查：名字的含义", "把访问到的名字按意思分类，并写出听到的理由。")
    add_form_table(document, ["时代意义", "地域特点", "美好愿望"], [
        ["1. __________________", "1. __________________", "1. __________________"],
        ["2. __________________", "2. __________________", "2. __________________"],
        ["3. __________________", "3. __________________", "3. __________________"],
        ["我的例子：____________", "我的例子：____________", "我的例子：____________"],
    ], [3120, 3120, 3120], row_height=0.62)
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
    ], [2600, 6760], row_height=0.72)
    return document


def _activity_05_check():
    document = card_document("活动 05 · 完成检查", "活动 05 · 调查与研究")
    add_label_box(document, "报告结束后检查", "小组一起确认，每一项都完成再交回材料。")
    add_bulleted(document, [
        "我们有资料。",
        "我们有具体例子。",
        "我们说明了理由。",
        "每个人都有一句话要说。",
        "我们回答了同伴的问题。",
    ])
    add_heading(document, "我们重说的一句话", 2)
    add_body(document, "____________________________________________________________")
    return document


def build_activity_index(specs: Sequence[dict]) -> tuple[Path, Path]:
    document = card_document("第一课活动材料索引", f"{COURSE_TITLE} · 教师使用")
    add_body(document, "课堂使用时，先打开对应活动资料夹。学生使用 PDF；修改时使用“可编辑原稿”里的 DOCX。", after=4)
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
    add_label_box(document, "发放方法", "先看教师速用说明，再发学生 PDF；同一活动的材料放在同一资料夹，不需要裁切。")
    material = save_material(ACTIVITY_DIR, "00-第一课活动材料索引", lambda: document)
    return material["docx"], material["pdf"]


def build_all() -> tuple[list[Path], list[Path], list[dict], Path]:
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
    index_docx, index_pdf = build_activity_index(specs)
    docx_paths.insert(0, index_docx)
    pdf_paths.insert(0, index_pdf)

    package_manifest = {
        "package": "boya-intermediate-lesson-01-activity-packages",
        "layout": "one_standalone_material_per_pdf_and_editable_docx",
        "language": "简体中文",
        "activities": specs,
        "index": {
            "pdf": rel(index_pdf),
            "docx": rel(index_docx),
        },
    }
    manifest_path = ACTIVITY_DIR / "activity-package-manifest.json"
    manifest_path.write_text(json.dumps(package_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return docx_paths, pdf_paths, specs, manifest_path


if __name__ == "__main__":
    generated_docx, generated_pdf, specs, manifest = build_all()
    print(json.dumps({
        "docx_count": len(generated_docx),
        "pdf_count": len(generated_pdf),
        "manifest": str(manifest),
    }, ensure_ascii=False, indent=2))
