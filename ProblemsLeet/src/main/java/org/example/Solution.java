package org.example;

import java.util.Arrays;
import java.util.stream.Collectors;

public class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = 0;
        int j = 0;
        int cnt = 0;
        int[] temp = new int[n+m];
        while (i<m && j<n)
        {
            if (nums1[i]<nums2[j])
            {
                temp[cnt] = nums1[i];
                i++;
                cnt++;
            }
            else
            {
                temp[cnt] = nums2[j];
                j++;
                cnt++;
            }

        }
        while(i<m) {
            temp[cnt] = nums1[i];
            cnt++;
            i++;
        }
        while(j<n) {
            temp[cnt] = nums2[j];
            cnt++;
            j++;
        }
        System.arraycopy(temp, 0, nums1, 0, m + n);
    }


    public int removeElement(int[] nums, int val) {
        int i =0;
        for (int j = 0 ; j< nums.length; j++)
        {
            if(nums[j] != val) {
                nums[i] = nums[j];
                i++;
            }
        }
        return i;
    }

//    public int removeDuplicates(int[] nums) {
//        int j = 0;
//        int i = 0;
//        while (i < nums.length) {
//            if (nums[i] != nums[j]) {
//                nums[++j] = nums[i];
//            }
//            i++;
//        }
//        return j + 1;
//    }

    public int removeDuplicates(int[] nums) {

        int j =1;
        int i =1;
        while(i<nums.length)
        {
            if(nums[i]!=nums[j])
            {
                nums[++j]=nums[i];
            }
            else {
                if (j >= 1 && nums[j - 1] != nums[i] && j+1<nums.length && i!=j) {
                    nums[++j] = nums[i];
                }
            }
            i++;
        }
        return j+1;
    }
    public int majorityElement(int[] nums) {
        int candidate = 0;
        int count = 0;

        for (int num : nums) {
            if (count == 0) {
                candidate = num;
            }

            if (num == candidate) {
                count++;
            } else {
                count--;
            }
        }

        return candidate;
    }

//    public void rotate(int[] nums, int k) {
//    /// 1 2 3 4
//    ///  4 1 2 3
//    ///  3 4 1 2
//
//        int n = nums.length;
//        if(k>=n)
//            k=k%n;
//
//
//        for (int i =0;i<k;i++)
//        {
//            int tmpF = nums[n-1];
//            for (int j = n-1;j>0;j--)
//            {
//                nums[j] = nums[j-1];
//            }
//            nums[0] = tmpF;
//
//        }
//    }

    public void rotate(int[] nums, int k) {
        /// 1 2 3 4
        ///  4 1 2 3
        ///  3 4 1 2

        int n = nums.length;
        if (k >= n)
            k = k % n;


        int[] v = new int[k];
        int cnt = 0;
        for (int i = n-k; i < n; i++) {
            v[cnt] = nums[i];
            cnt++;
        }
        for (int i = n - k - 1; i >= 0; i--) {
            nums[i + k] = nums[i];}

        for (int i = 0; i < k; i++) {
            nums[i] = v[i];
        }
    }

//    public int maxProfit(int[] prices) {
//        int n = prices.length;
//        int[] dp = new int[n];
//        int minPrice = prices[0];
//
//        dp[0] = 0;
//
//        for (int i = 1; i < n; i++) {
//            minPrice = Math.min(minPrice, prices[i]);
//            dp[i] = Math.max(dp[i - 1], prices[i] - minPrice);
//        }
//        return dp[n-1];
//    }

    public int maxProfit(int[] prices) {
        int n = prices.length;
        int[] dp = new int[n];
        int totalProfit = 0;
        dp[0] = 0;

        for (int i = 1; i < n; i++) {

        }
        return dp[n-1];
    }
}
