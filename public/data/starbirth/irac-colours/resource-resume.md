# Resumption after a pre-spawn resource stop

The first guard stopped with elevated system memory pressure before launching
any scientific worker. It produced no colour readout. Its receipt remains in
`artifacts/irac_colour_diagnostic_20261012/`; no stopped result is overwritten.
The unrelated Proof Atlas Lean build (PID 38678) then finished on its own.
Live checks now show normal pressure, the PID absent and more than 5 GiB free.
No external process was cancelled; the earlier cancellation question is moot.

This amendment permits only the previously registered offline calculation and
independent checker in the two new exact stages named in the JSON amendment.
All sixteen inputs, source selections, colour/availability definitions, missing
values and sensitivities remain frozen. Both workers retain 256 MiB sampled RSS,
one CPU, ten minutes, 1 MiB outputs each and the 5 GiB reserve. All failed and
resumed files combined remain below the original 4 MiB ceiling. This is resource
resumption after no execution, not retuning a failed scientific question or a
new observation/model experiment. Any further stop is retained and ends this run.
