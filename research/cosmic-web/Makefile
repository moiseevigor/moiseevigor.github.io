# Reproduction map: paper artefact -> command.  Run `make all` (hours) or
# individual targets.  Requires: python3.13 venv with requirements.txt.
PY := .venv/bin/python

toy-benchmark:            ## Sec 5.1-5.2 / corrected E0 tables
	$(PY) scripts/run_e0.py --eval-seeds 50
	$(PY) scripts/run_e0.py --curved --eval-seeds 50
	$(PY) scripts/write_e0_report.py

residual:                 ## Fig 1, Table 1 (E4)
	$(PY) scripts/run_e4.py

model-ladder:             ## Fig 2, Table 2 (E5, E5b, E5c, E5d)
	$(PY) scripts/run_e5.py && $(PY) scripts/run_e5b.py
	$(PY) scripts/run_e5c.py && $(PY) scripts/run_e5d.py

baselines:                ## Table 3 (E9: 2LPT, MUSCLE)
	$(PY) scripts/run_e9.py

transfer:                 ## Fig 3, Table 4 (E6, E7, E7b)
	$(PY) scripts/run_e6.py && $(PY) scripts/run_e7.py && $(PY) scripts/run_e7b.py

field-level:              ## Fig 4 (E8)
	$(PY) scripts/run_e8.py

truth-validation:         ## Sec 2.1 (E10 convergence; E12 external, needs data/camels*)
	$(PY) scripts/run_e10.py
	$(PY) scripts/run_e12.py
	E12_TAG=camels_astrid E12_ICS=camels $(PY) scripts/run_e12.py

figures:                  ## regenerate docs/paper-figures/*
	$(PY) scripts/make_paper_figures.py

paper: figures            ## compile paper/main.pdf (needs tectonic: brew install tectonic)
	cd paper && tectonic main.tex

all: toy-benchmark residual model-ladder baselines transfer field-level truth-validation figures paper
.PHONY: all toy-benchmark residual model-ladder baselines transfer field-level truth-validation figures paper
