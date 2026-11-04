import matplotlib.pyplot as plt
import numpy as np

# 判別直線の式: 0.01633*x1 + 0.08862*x2 - 7.0811 = 0
# x2 = (7.0811 - 0.01633*x1) / 0.08862

x1_vals = np.linspace(30, 100, 100)
x2_vals = (7.0811 - 0.01633 * x1_vals) / 0.08862

# G1, G2 のデータプロット（例: G1は青丸'o'、G2は赤バツ'x'）
# plt.scatter(G1_x1, G1_x2, color='blue', marker='o', label='G1 (Passed)')
# plt.scatter(G2_x1, G2_x2, color='red', marker='x', label='G2 (Failed)')
# plt.plot(x1_vals, x2_vals, color='green', linestyle='--', label='Decision Boundary')
# plt.xlabel('Math (x1)')
# plt.ylabel('English (x2)')
# plt.legend()
# plt.show()