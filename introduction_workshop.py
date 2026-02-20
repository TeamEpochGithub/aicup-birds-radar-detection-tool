# Author: Willem Dieleman - AI Cup 2026.
# Modified by Reindert Pelsma: added debug submission output as example for the radar track website


import pandas as pd
import sklearn.metrics
import numpy as np
from shapely import wkb
from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import StratifiedKFold
from sklearn.base import clone

train_df = pd.read_csv("train.csv")
test_df = pd.read_csv("test.csv")

train_df = train_df.set_index("track_id")
test_df = test_df.set_index("track_id")


def split_xyzm(wkb_hex):
    geom = wkb.loads(bytes.fromhex(wkb_hex))
    coords = list(geom.coords)

    xs, ys, zs, RCSs = zip(*coords)

    return pd.Series({"x": xs, "y": ys, "z": zs, "RCS": RCSs})


extra_train_cols = train_df["trajectory"].apply(split_xyzm)
extra_test_cols = test_df["trajectory"].apply(split_xyzm)

train_df = train_df.join(extra_train_cols)
test_df = test_df.join(extra_test_cols)

train_df["mean_RCS"] = train_df["RCS"].apply(np.mean)
test_df["mean_RCS"] = test_df["RCS"].apply(np.mean)

features = ["airspeed", "min_z", "max_z", "mean_RCS", "radar_bird_size"]

X = train_df[features]
X_test = test_df[features]

y = train_df["bird_group"]


preprocessor = ColumnTransformer(
    [("cat", OneHotEncoder(), ["radar_bird_size"])], remainder="passthrough"
)

pipeline = Pipeline(
    [
        ("preprocess", preprocessor),
        ("model", HistGradientBoostingClassifier(random_state=42)),
    ]
)

n_splits = 5

cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

split = list(cv.split(X, y))

for i, (train_idx, val_idx) in enumerate(split):
    print(f"fold {i+1} train: {len(train_idx)}, val:  {len(val_idx)}")

classes = np.unique(y)

oof_preds = pd.DataFrame(0.0, index=X.index, columns=classes)
test_preds = np.zeros((len(X_test), len(classes)))

# Array to keep track of which fold each training sample belongs to (useful for debugging)
train_df["cv_fold"] = -1

for i, (train_idx, val_idx) in enumerate(split):
    # Record the fold number in our dataframe
    train_df.loc[train_df.index[val_idx], "cv_fold"] = i + 1

    X_train = X.iloc[train_idx]
    y_train = y.iloc[train_idx]

    X_val = X.iloc[val_idx]
    y_val = y.iloc[val_idx]

    pipeline_fold = clone(pipeline)
    pipeline_fold.fit(X_train, y_train)

    val_preds = pipeline_fold.predict_proba(X_val)
    oof_preds.iloc[val_idx] = val_preds

    test_preds_fold = pipeline_fold.predict_proba(X_test)
    test_preds += test_preds_fold

    print(f"Trained fold {i+1}/{n_splits}!")


def score(
    solution: pd.DataFrame,
    submission: pd.DataFrame,
) -> float:
    # Takes in two pandas dataframe and computes the Macro-averaged Average Precision Score

    # Ensure all required columns are present
    needed_columns = [
        "Clutter",
        "Cormorants",
        "Pigeons",
        "Ducks",
        "Geese",
        "Gulls",
        "Birds of Prey",
        "Waders",
        "Songbirds",
    ]

    # Reorder solution and submission columns/rows to match exactly
    solution = solution.loc[solution.index, needed_columns]
    submission = submission.loc[solution.index, needed_columns]

    # Compute the Average Precision score for all required columns
    bird_score = sklearn.metrics.average_precision_score(
        solution[needed_columns], submission[needed_columns], average="macro"
    )

    return bird_score


solution_df = train_df.groupby(["track_id", "bird_group"]).size().unstack(fill_value=0)

oof_score = score(solution_df, oof_preds)
print(f"OOF score: {oof_score}")

# ---------------------------------------------------------
# 1. Standard Kaggle Submission (Test data only)
# ---------------------------------------------------------
submission_df = pd.DataFrame(test_preds / n_splits, index=X_test.index, columns=classes)

submission_df.to_csv("introduction_notebook_submission.csv")
print("Saved Kaggle submission to introduction_notebook_submission.csv")

# ---------------------------------------------------------
# 2. Bird Track Radar Tool Debug Submission (Train + Test + Features)
# ---------------------------------------------------------
print("Generating debug submission for Bird Track Radar...")

# Combine train (OOF) and test predictions
all_preds = pd.concat([oof_preds, submission_df])

# Extract features to use as debug columns
debug_cols = ["mean_RCS", "cv_fold"]

# Assign cv_fold = -1 to test_df to indicate it wasn't part of training folds
test_df["cv_fold"] = -1

# Combine the debug columns from train and test
all_debug_features = pd.concat([train_df[debug_cols], test_df[debug_cols]])

# Join the predictions with the debug columns
debug_submission_df = all_preds.join(all_debug_features)

# Save to CSV
debug_submission_df.to_csv("debug_introduction_notebook_submission.csv")
print("Saved debug submission to debug_introduction_notebook_submission.csv")
