const fs = require('fs');
const file = 'src/app/(dashboard)/expenses/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const marker = '{/* ── 24/7 AUTOMATED MOBILE TRACKING SETUP MODAL ── */}';
const index = content.indexOf(marker);

if (index !== -1) {
    const perfectBlock = `      {/* ── 24/7 AUTOMATED MOBILE TRACKING SETUP MODAL ── */}
      <AnimatePresence>
        {showWebhookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowWebhookModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#0C1017] border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar text-foreground"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl gold-gradient-bg text-slate-950 shadow-md">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      24/7 Automated Mobile SMS & GPay Tracking
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      Connect your Android or iPhone to log transactions continuously in the background
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Webhook Endpoint Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Your Cloud Webhook Endpoint URL
                </label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs text-emerald-400 shadow-inner overflow-x-auto">
                  <span className="truncate flex-1">{typeof window !== "undefined" ? \`\${window.location.origin}/api/webhook/expense\` : "/api/webhook/expense"}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const url = typeof window !== "undefined" ? \`\${window.location.origin}/api/webhook/expense\` : ""
                      navigator.clipboard.writeText(url)
                      setCopiedUrl(true)
                      toast.success("Webhook URL copied to clipboard!")
                      setTimeout(() => setCopiedUrl(false), 3000)
                    }}
                    className="h-8 px-3 rounded-xl gold-gradient-bg text-slate-950 font-bold text-[11px] shrink-0 gap-1.5"
                  >
                    {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" /> : <Link className="h-3.5 w-3.5" />}
                    {copiedUrl ? "Copied!" : "Copy URL"}
                  </Button>
                </div>
              </div>

              {/* Setup Guide Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-5 rounded-2xl bg-white/5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20">📱</span> Android Automation Setup
                  </div>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside font-medium leading-relaxed">
                    <li>Install a free automation app like <strong className="text-foreground">MacroDroid</strong> or <strong className="text-foreground">Tasker</strong>.</li>
                    <li>Create a trigger for <strong className="text-foreground">Incoming SMS</strong> or <strong className="text-foreground">GPay Notification</strong> from bank sender IDs.</li>
                    <li>Add action <strong className="text-foreground">HTTP POST Request</strong> to your copied Webhook URL above.</li>
                    <li>Set JSON Body: <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300">{"{\\"text\\":\\"[SMS_Text]\\""}</code>.</li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                    <span className="p-1.5 rounded-lg bg-purple-500/20">🍏</span> iPhone Shortcuts Setup
                  </div>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside font-medium leading-relaxed">
                    <li>Open Apple <strong className="text-foreground">Shortcuts App</strong> → Automation → New Personal Automation.</li>
                    <li>Choose trigger <strong className="text-foreground">Message Received</strong> or <strong className="text-foreground">GPay / Apple Pay</strong> alert.</li>
                    <li>Add action <strong className="text-foreground">Get Contents of URL</strong> pointing to your Webhook URL.</li>
                    <li>Set method to <strong className="text-foreground">POST</strong>, Request Body to <strong className="text-foreground">JSON</strong>, and add key <code className="bg-black/60 px-1 rounded text-amber-300">text</code> with value <strong className="text-foreground">Shortcut Input</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Live Test Trigger Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-slate-900/60 to-amber-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    🧪 Test Your Webhook Engine Right Now
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    Click to simulate an instant UPI debit alert arriving from a phone in the background.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    setTestingWebhook(true)
                    try {
                      const res = await fetch("/api/webhook/expense", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: \`Rs 520 debited from A/c XX4218 on \${new Date().toISOString().split("T")[0]} to Starbucks Coffee via UPI Ref 901283\`
                        })
                      })
                      const data = await res.json()
                      if (data.success) {
                        toast.success("🎉 Background Webhook Test Passed! Logged ₹520 at Starbucks.")
                        fetchAll()
                      } else {
                        toast.error("Webhook test failed: " + (data.message || data.error))
                      }
                    } catch (e) {
                      toast.error("Error triggering test: " + e.message)
                    } finally {
                      setTestingWebhook(false)
                    }
                  }}
                  disabled={testingWebhook}
                  className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shrink-0 gap-1.5"
                >
                  {testingWebhook ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Simulate Live SMS Alert →
                </Button>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/30">
                <Button
                  onClick={() => setShowWebhookModal(false)}
                  className="h-10 px-6 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs shadow-md"
                >
                  Got It, Done! ✓
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Financial Engine...</div>}>
      <ExpensesContent />
    </Suspense>
  )
}
`;

    content = content.substring(0, index) + perfectBlock;
    fs.writeFileSync(file, content, 'utf8');
    console.log("File fixed successfully via direct append!");
} else {
    console.log("Marker not found in the file!");
}
