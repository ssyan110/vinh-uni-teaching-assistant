import AppKit
import Foundation
import Vision

func cgImage(from image: NSImage) -> CGImage? {
    var rect = CGRect(origin: .zero, size: image.size)
    return image.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

for file in CommandLine.arguments.dropFirst() {
    guard let image = NSImage(contentsOfFile: file), let cg = cgImage(from: image) else {
        fputs("ERROR\t\(file)\tunable_to_read\n", stderr)
        continue
    }
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    do {
        let handler = VNImageRequestHandler(cgImage: cg, orientation: .up, options: [:])
        try handler.perform([request])
        let observations = request.results ?? []
        if observations.isEmpty {
            print("NONE\t\(file)")
        } else {
            for observation in observations {
                let payload = observation.payloadStringValue ?? ""
                let box = observation.boundingBox
                print("QR\t\(file)\t\(payload)\t\(box.origin.x)\t\(box.origin.y)\t\(box.size.width)\t\(box.size.height)")
            }
        }
    } catch {
        fputs("ERROR\t\(file)\t\(error)\n", stderr)
    }
}
