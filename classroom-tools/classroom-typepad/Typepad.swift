import AppKit
import Carbon

// The nonactivating panel receives keystrokes while the slide app owns the menu bar.
final class WritingArea: NSTextView {
    override func performKeyEquivalent(with event: NSEvent) -> Bool {
        let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
        if flags == .command {
            switch event.charactersIgnoringModifiers?.lowercased() {
            case "v": pasteAsPlainText(nil)
            case "c": copy(nil)
            case "x": cut(nil)
            case "a": selectAll(nil)
            case "z": undoManager?.undo()
            default: return super.performKeyEquivalent(with: event)
            }
            return true
        }
        if flags == [.command, .shift], event.charactersIgnoringModifiers?.lowercased() == "z" {
            undoManager?.redo()
            return true
        }
        return super.performKeyEquivalent(with: event)
    }
}

final class WritingPanel: NSPanel {
    override var canBecomeKey: Bool { true }
}

final class Typepad: NSObject, NSApplicationDelegate, NSTextViewDelegate {
    let panel = WritingPanel(contentRect: NSRect(x: 0, y: 0, width: 700, height: 315),
                             styleMask: [.titled, .closable, .resizable, .utilityWindow, .nonactivatingPanel],
                             backing: .buffered, defer: false)
    let editor = WritingArea()
    let sizeLabel = NSTextField(labelWithString: "")
    let shortcutLabel = NSTextField(labelWithString: "")
    let selfTest = CommandLine.arguments.contains("--check")
    var size: CGFloat = 64
    var hotKey: EventHotKeyRef?
    var status: NSStatusItem!
    func applicationDidFinishLaunching(_ notification: Notification) {
        panel.title = "课堂打字板"
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.isFloatingPanel = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.minSize = NSSize(width: 340, height: 160)
        panel.center()
        if !selfTest {
            panel.setFrameAutosaveName("ClassroomTypepadFrame")
            let savedSize = UserDefaults.standard.double(forKey: "size")
            if (32...160).contains(savedSize) { size = savedSize }
            editor.string = UserDefaults.standard.string(forKey: "draft") ?? ""
        }
        let scroll = NSScrollView()
        scroll.hasVerticalScroller = true
        scroll.autohidesScrollers = true
        editor.isRichText = false
        editor.allowsUndo = true
        editor.isVerticallyResizable = true
        editor.autoresizingMask = [.width]
        editor.textContainer?.widthTracksTextView = true
        editor.textContainerInset = NSSize(width: 15, height: 12)
        editor.appearance = NSAppearance(named: .aqua)
        editor.backgroundColor = .white
        editor.textColor = NSColor(srgbRed: 0.08, green: 0.17, blue: 0.24, alpha: 1)
        editor.delegate = self
        scroll.documentView = editor
        let smaller = NSButton(title: "缩小", target: self, action: #selector(shrink))
        let larger = NSButton(title: "放大", target: self, action: #selector(grow))
        let bar = NSStackView(views: [smaller, sizeLabel, larger, shortcutLabel])
        bar.spacing = 8
        let root = panel.contentView!
        for view in [bar, scroll] { view.translatesAutoresizingMaskIntoConstraints = false; root.addSubview(view) }
        NSLayoutConstraint.activate([
            bar.topAnchor.constraint(equalTo: root.topAnchor, constant: 5),
            bar.leadingAnchor.constraint(equalTo: root.leadingAnchor, constant: 10),
            scroll.topAnchor.constraint(equalTo: bar.bottomAnchor, constant: 5),
            scroll.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: root.bottomAnchor)
        ])
        updateFont()
        if !selfTest {
            status = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
            status.button?.title = "字"
            let menu = NSMenu()
            for (title, action) in [("显示打字板", #selector(show)), ("退出", #selector(quit))] {
                let item = menu.addItem(withTitle: title, action: action, keyEquivalent: "")
                item.target = self
            }
            status.menu = menu
            installShortcut()
        }
        show()
        if selfTest {
            editor.insertText("上课打字 Tiếng Việt", replacementRange: NSRange(location: 0, length: 0))
            grow()
            panel.orderOut(nil)
            show()
            precondition(editor.string == "上课打字 Tiếng Việt" && editor.font?.pointSize == 72)
            precondition(panel.isVisible && panel.firstResponder === editor && panel.level == .floating)
            print("PASS native typing, font size, hide/reopen and editor focus")
            NSApp.terminate(nil)
        }
    }
    func installShortcut() {
        var event = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        let installed = InstallEventHandler(GetApplicationEventTarget(), { _, _, context in
            guard let context else { return OSStatus(eventNotHandledErr) }
            let app = Unmanaged<Typepad>.fromOpaque(context).takeUnretainedValue()
            if app.panel.isKeyWindow { app.panel.orderOut(nil) } else { app.show() }
            return noErr
        }, 1, &event, Unmanaged.passUnretained(self).toOpaque(), nil)
        let registered = installed == noErr && RegisterEventHotKey(UInt32(kVK_ANSI_B), UInt32(controlKey | optionKey),
            EventHotKeyID(signature: 0x56545044, id: 1), GetApplicationEventTarget(), 0, &hotKey) == noErr
        shortcutLabel.stringValue = registered ? "⌃⌥B 呼出 / 收起" : "点菜单栏「字」呼出"
    }
    func textDidChange(_ notification: Notification) {
        if !selfTest { UserDefaults.standard.set(editor.string, forKey: "draft") }
    }
    func updateFont() {
        editor.font = .systemFont(ofSize: size)
        sizeLabel.stringValue = "\(Int(size)) pt"
        if !selfTest { UserDefaults.standard.set(Double(size), forKey: "size") }
    }
    @objc func grow() { size = min(160, size + 8); updateFont(); panel.makeFirstResponder(editor) }
    @objc func shrink() { size = max(32, size - 8); updateFont(); panel.makeFirstResponder(editor) }
    @objc func show() { panel.makeKeyAndOrderFront(nil); panel.makeFirstResponder(editor) }
    @objc func quit() { NSApp.terminate(nil) }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool { show(); return true }
}
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = Typepad()
app.delegate = delegate
app.run()
