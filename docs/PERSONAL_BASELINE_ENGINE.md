# Personal Baseline Deviation Engine Specification

## 1. Mathematical Formulation & Architecture

The **Personal Baseline Deviation Engine** evaluates student wellbeing and digital biomarkers against the student's **own historical trajectory** rather than static, one-size-fits-all population thresholds.

### Core Mathematical Definitions:

1. **Historical Baseline Center ($\mu_{\text{usual}}$)**:
   $$\mu_{\text{usual}} = \frac{1}{N} \sum_{i=1}^{N} x_i$$
   where $N$ is the number of valid observations recorded in the selected window ($7\text{d}, 30\text{d}, 90\text{d}, 180\text{d}$).

2. **Historical Baseline Scale ($\sigma_{\text{usual}}$)**:
   $$\sigma_{\text{usual}} = \sqrt{\frac{1}{N - 1} \sum_{i=1}^{N} (x_i - \mu_{\text{usual}})^2} \quad (\text{for } N \ge 2)$$

3. **Recent Trend Center ($\mu_{\text{recent}}$)**:
   $$\mu_{\text{recent}} = \frac{1}{M} \sum_{j=1}^{M} x_j \quad (\text{observations within the last 7 calendar days})$$

4. **Linear Baseline Deviation ($\Delta$)**:
   $$\Delta_{\text{metric}} = \mu_{\text{recent}} - \mu_{\text{usual}}$$

5. **Standardized Z-Score ($Z$) with Zero-Variance & Outlier Safeguards**:
   $$Z = \begin{cases} 
   0.0 & \text{if } \sigma_{\text{usual}} < 10^{-5} \text{ or } N < 3 \\
   \text{clamp}\left(\frac{x_t - \mu_{\text{usual}}}{\sigma_{\text{usual}}}, -4.0, +4.0\right) & \text{otherwise}
   \end{cases}$$

---

## 2. Cold-Start & Calibration Confidence States

To prevent misclassifying new students, the baseline engine operates across three distinct confidence tiers:

```
    Observations (N)          Confidence Tier                   Engine Action / UI State
   ─────────────────────────────────────────────────────────────────────────────────────────────
       N < 3 days         INITIALIZING / ESTABLISHING   Displays "Establishing personal baseline".
                                                        No automated clinical risk triggered.
                                                        
     3 <= N <= 6 days              MODERATE             Initial rolling deviations computed.
                                                        Directional momentum visible in chart.
                                                        
       N >= 7 days                   HIGH               Fully calibrated personal baseline.
                                                        Deviation thresholds actively alert.
```

* **Non-Stigmatizing Default**: A student with zero historical logs is **never** assigned a crisis risk level simply because history is absent. The UI displays clean empty indicators (`"—"`).

---

## 3. Rolling Time Windows ($7\text{d}, 30\text{d}, 90\text{d}, 180\text{d}$)

* **$7\text{d}$ Window**: Tracks acute weekly fluctuations (e.g. immediate exam pressure or sleep loss).
* **$30\text{d}$ Window**: Standard monthly psychological baseline, filtering out transient single-day noise.
* **$90\text{d}$ Window**: Semester-long trend analysis capturing cumulative burnout and chronic fatigue.
* **$180\text{d}$ Window**: Longitudinal academic year trajectory, capturing inter-semester recovery and baseline stability.

---

## 4. Handling Irregular, Delayed, and Missing Telemetry

1. **Non-Penalizing Missing Data**:
   * If a student does not log on during a weekend or holiday, missing days are **excluded from the denominator** rather than imputed as 0 hours of sleep or 0 minutes of screen time.
   * Treating missing telemetry as 0 hours sleep would falsely trigger acute clinical distress alerts.
2. **Desktop Heartbeat & Disconnection**:
   * Telemetry logs carry a `synced_at` timestamp. If the desktop collector has not pulsed in $> 15\text{ minutes}$, the status is flagged as `Disconnected` (`is_agent_connected = False`).
3. **Out-of-Order & Duplicate Log Resolution**:
   * Entries are bucketed by calendar date (`YYYY-MM-DD`) in UTC. If multiple check-ins occur on the same date, the daily center is computed via chronological arithmetic mean.
4. **Outlier Clamping**:
   * Extreme readings (e.g. recording $> 24\text{ hours}$ screen time due to machine sleep suspend failure) are validated and clipped to physiological bounds.

---

## 5. Clinical Disclaimer

> **Important**: Personal baseline deviations indicate behavioral momentum and physiological rest patterns; they **do not constitute a medical or clinical psychiatric diagnosis**. High deviations prompt supportive micro-interventions or voluntary counselor consultations.
