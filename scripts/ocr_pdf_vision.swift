import AppKit
import Foundation
import PDFKit
import Vision

struct Options {
    let pdfPath: String
    let outputDirectory: URL
    let firstPage: Int
    let lastPage: Int?
    let maxDimension: CGFloat
}

func usage() -> Never {
    fputs("Usage: ocr_pdf_vision.swift --pdf FILE --out-dir DIR [--from N] [--to N] [--max-dimension N]\n", stderr)
    exit(2)
}

func parseOptions() -> Options {
    var pdfPath: String?
    var outputDirectory: URL?
    var firstPage = 1
    var lastPage: Int?
    var maxDimension: CGFloat = 2400
    var index = 1

    while index < CommandLine.arguments.count {
        let argument = CommandLine.arguments[index]
        switch argument {
        case "--pdf":
            index += 1
            guard index < CommandLine.arguments.count else { usage() }
            pdfPath = CommandLine.arguments[index]
        case "--out-dir":
            index += 1
            guard index < CommandLine.arguments.count else { usage() }
            outputDirectory = URL(fileURLWithPath: CommandLine.arguments[index], isDirectory: true)
        case "--from":
            index += 1
            guard index < CommandLine.arguments.count, let value = Int(CommandLine.arguments[index]), value > 0 else { usage() }
            firstPage = value
        case "--to":
            index += 1
            guard index < CommandLine.arguments.count, let value = Int(CommandLine.arguments[index]), value > 0 else { usage() }
            lastPage = value
        case "--max-dimension":
            index += 1
            guard index < CommandLine.arguments.count, let value = Double(CommandLine.arguments[index]), value >= 800 else { usage() }
            maxDimension = CGFloat(value)
        default:
            usage()
        }
        index += 1
    }

    guard let pdfPath, let outputDirectory else { usage() }
    return Options(pdfPath: pdfPath, outputDirectory: outputDirectory, firstPage: firstPage, lastPage: lastPage, maxDimension: maxDimension)
}

func cgImage(from image: NSImage) -> CGImage? {
    var proposedRect = CGRect(origin: .zero, size: image.size)
    return image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil)
}

func recognizedText(from cgImage: CGImage) throws -> (String, [[String: Any]]) {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]

    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
    try handler.perform([request])
    let observations = request.results ?? []
    let ordered = observations.sorted { left, right in
        let leftBox = left.boundingBox
        let rightBox = right.boundingBox
        let yDelta = abs(leftBox.midY - rightBox.midY)
        if yDelta > 0.012 {
            return leftBox.midY > rightBox.midY
        }
        return leftBox.minX < rightBox.minX
    }
    var boxes: [[String: Any]] = []
    let strings = ordered.compactMap { observation -> String? in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        boxes.append([
            "text": candidate.string,
            "x": box.minX,
            "y": box.minY,
            "width": box.width,
            "height": box.height,
            "confidence": candidate.confidence,
        ])
        return candidate.string
    }
    return (strings.joined(separator: "\n"), boxes)
}

let options = parseOptions()
guard let document = PDFDocument(url: URL(fileURLWithPath: options.pdfPath)) else {
    fputs("Unable to open PDF: \(options.pdfPath)\n", stderr)
    exit(1)
}

try FileManager.default.createDirectory(at: options.outputDirectory, withIntermediateDirectories: true)
let first = max(1, options.firstPage)
let last = min(options.lastPage ?? document.pageCount, document.pageCount)
guard first <= last else {
    fputs("Invalid page range \(first)-\(last) for \(document.pageCount)-page PDF\n", stderr)
    exit(2)
}

var failures: [[String: Any]] = []
for pageNumber in first...last {
    autoreleasepool {
        let target = options.outputDirectory.appendingPathComponent(String(format: "page-%03d.txt", pageNumber))
        guard let page = document.page(at: pageNumber - 1) else {
            failures.append(["page": pageNumber, "error": "missing_page"])
            return
        }
        let bounds = page.bounds(for: .mediaBox)
        let ratio = max(bounds.width, bounds.height) / max(1, min(bounds.width, bounds.height))
        let width: CGFloat
        let height: CGFloat
        if bounds.width >= bounds.height {
            width = options.maxDimension
            height = options.maxDimension / ratio
        } else {
            height = options.maxDimension
            width = options.maxDimension / ratio
        }
        let image = page.thumbnail(of: CGSize(width: width, height: height), for: .mediaBox)
        guard let cg = cgImage(from: image) else {
            failures.append(["page": pageNumber, "error": "render_failed"])
            return
        }
        do {
            let (text, boxes) = try recognizedText(from: cg)
            try text.write(to: target, atomically: true, encoding: .utf8)
            let pageJSON: [String: Any] = ["page": pageNumber, "observations": boxes]
            let pageData = try JSONSerialization.data(withJSONObject: pageJSON, options: [.prettyPrinted, .sortedKeys])
            try pageData.write(to: options.outputDirectory.appendingPathComponent(String(format: "page-%03d.json", pageNumber)))
            print("OCR\t\(pageNumber)\t\(text.count)\t\(target.path)")
        } catch {
            failures.append(["page": pageNumber, "error": String(describing: error)])
            try? "".write(to: target, atomically: true, encoding: .utf8)
            fputs("ERROR\t\(pageNumber)\t\(error)\n", stderr)
        }
    }
}

let manifest: [String: Any] = [
    "pdf": URL(fileURLWithPath: options.pdfPath).standardizedFileURL.path,
    "page_count": document.pageCount,
    "processed_from": first,
    "processed_to": last,
    "max_dimension": options.maxDimension,
    "ocr_engine": "macOS Vision VNRecognizeTextRequest",
    "failures": failures,
]
let manifestData = try JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try manifestData.write(to: options.outputDirectory.appendingPathComponent("manifest.json"))
print("DONE\t\(first)-\(last)\tfailures=\(failures.count)")
