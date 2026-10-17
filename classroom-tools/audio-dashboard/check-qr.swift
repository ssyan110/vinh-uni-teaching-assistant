import Foundation
import Vision
let entry = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) as! [String: Any]
let request = VNDetectBarcodesRequest()
request.symbologies = [.qr]
try VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1])).perform([request])
guard let decoded = request.results?.first?.payloadStringValue, decoded == entry["responderUri"] as? String else { fatalError("QR does not match the student URL") }
print("QR decode passed: student responder URL matches")
