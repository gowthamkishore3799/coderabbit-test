# pip install dspy==3.0.3

import os, dspy

# 1) Configure your LM (swap to your provider/model if you like)
os.environ["OPENAI_API_KEY"] = "sk-..."  # or pass api_key=...
lm = dspy.LM("openai/gpt-4o-mini")
dspy.configure(lm=lm)

# 2) Define the task schema and a tiny program
class QA(dspy.Signature):
    """Answer the question concisely."""
    question: str
    answer: str

class Answerer(dspy.Module):
    def __init__(self):
        super().__init__()
        self.step = dspy.Predict(QA)

    def forward(self, question: str):
        return self.step(question=question)

# 3) Tiny trainset (few-shot candidates the optimizer can pick from)
train = [
    dspy.Example(question="Capital of France?", answer="Paris"),
    dspy.Example(question="2 + 2?", answer="4"),
    dspy.Example(question="HTTP status for Not Found?", answer="404"),
]

# 4) Metric and compile (optimize demos/instructions automatically)
def metric(ex, pred, trace=None):
    return dspy.evaluate.answer_exact_match(ex, pred)

opt = dspy.BootstrapFewShot(metric=metric)
compiled = opt.compile(Answerer(), trainset=train)

# 5) Inference (set rollout_id/temperature to bypass cache when iterating)
res = compiled(question="Largest planet in our solar system?")
print(res.answer)
