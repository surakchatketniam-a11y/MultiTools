/** Camera scanning stays on device and only prefills the ticket form. */
(function(root) {
    'use strict';

    function open(form) {
        const dialog = document.createElement('dialog');
        dialog.className = 'book-dialog scanner-dialog';
        dialog.innerHTML = `
            <div class="p-5 space-y-4">
                <div class="flex items-center justify-between gap-3">
                    <h2 class="text-xl font-bold">สแกนสลาก</h2>
                    <button type="button" class="btn-close-modal" aria-label="ปิดหน้าสแกน">×</button>
                </div>
                <p class="text-muted">สแกน QR หรือบาร์โค้ด แล้วตรวจเลข งวด และจำนวนใบในฟอร์มก่อนบันทึก ข้อมูลภาพไม่ถูกส่งออกจากเครื่อง</p>
                <video autoplay playsinline muted aria-label="ภาพจากกล้องสำหรับสแกนสลาก"></video>
                <p id="scanStatus" role="status">กำลังเปิดกล้อง…</p>
                <label for="scanRawInput" class="block font-semibold">หรือวางข้อความจากโค้ด</label>
                <textarea id="scanRawInput" rows="2" class="w-full bg-surface border border-line rounded-lg p-2 text-ink" placeholder="เลขสลาก 6 หลัก หรือ number=007579; draw=2026-10-16; count=2"></textarea>
                <button type="button" id="btnParseCode" class="px-4 py-2 bg-action rounded-lg font-semibold">อ่านข้อมูล</button>
            </div>`;
        document.body.appendChild(dialog);
        const video = dialog.querySelector('video');
        const status = dialog.querySelector('#scanStatus');
        let stream = null;
        let running = true;
        let lastScan = 0;
        let busy = false;

        function stop() {
            running = false;
            if (stream) stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        function apply(raw) {
            const parsed = root.LottoScanner.parse(raw);
            if (!parsed) {
                status.textContent = 'อ่านเลขสลากไม่ได้ กรุณากรอกเลข 6 หลักด้วยตนเอง';
                return false;
            }
            form.querySelector('#ticketNumber').value = parsed.number;
            if (parsed.drawDate) form.querySelector('#ticketDrawDate').value = parsed.drawDate;
            if (parsed.count) form.querySelector('#ticketCount').value = parsed.count;
            dialog.close();
            root.LottoApp.showToast('เติมข้อมูลลงฟอร์มแล้ว กรุณาตรวจสอบก่อนบันทึก', 'info');
            form.querySelector('#ticketNumber').focus();
            return true;
        }
        dialog.querySelector('.btn-close-modal').addEventListener('click', () => dialog.close());
        dialog.querySelector('#btnParseCode').addEventListener('click', () =>
            apply(dialog.querySelector('#scanRawInput').value));
        dialog.addEventListener('close', () => { stop(); dialog.remove(); }, { once: true });
        dialog.showModal();

        async function start() {
            if (!root.isSecureContext || !navigator.mediaDevices?.getUserMedia || !root.BarcodeDetector) {
                status.textContent = 'เบราว์เซอร์นี้ยังไม่รองรับการสแกนด้วยกล้อง ใช้ช่องข้อความหรือกรอกในฟอร์มได้';
                video.hidden = true;
                return;
            }
            try {
                const supported = await root.BarcodeDetector.getSupportedFormats();
                const formats = ['qr_code', 'code_128', 'ean_13'].filter(value => supported.includes(value));
                if (!formats.length) throw new Error('ไม่รองรับรูปแบบ QR/บาร์โค้ด');
                const detector = new root.BarcodeDetector({ formats });
                stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } });
                if (!running) { stream.getTracks().forEach(track => track.stop()); return; }
                video.srcObject = stream;
                await video.play();
                status.textContent = 'เล็งกล้องไปที่ QR หรือบาร์โค้ดบนสลาก';
                const scan = async (time) => {
                    if (!running) return;
                    if (!busy && time - lastScan > 300 && video.readyState >= 2) {
                        busy = true;
                        lastScan = time;
                        try {
                            const codes = await detector.detect(video);
                            for (const code of codes) if (apply(code.rawValue)) return;
                        } catch (err) { status.textContent = `สแกนไม่สำเร็จ: ${err.message}`; }
                        busy = false;
                    }
                    root.requestAnimationFrame(scan);
                };
                root.requestAnimationFrame(scan);
            } catch (err) {
                status.textContent = `เปิดกล้องไม่ได้: ${err.message} กรุณากรอกด้วยตนเอง`;
                video.hidden = true;
                stop();
            }
        }
        start();
    }

    root.LottoScanUI = { open };
})(typeof window !== 'undefined' ? window : global);
